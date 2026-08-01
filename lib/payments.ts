import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { LIQPAY_PAID_STATUSES, LIQPAY_HELD_STATUSES, amountMatches } from "@/lib/liqpay";
import { notifyPaidOrder } from "@/lib/notify";
import { sendOrderEmail } from "@/lib/email";
import { escapeHtml, sendTelegram } from "@/lib/telegram";

export type SettleInput = {
  orderId: string;
  status: string;
  amount?: unknown;
  currency?: unknown;
  paymentId?: string | null;
  source: "callback" | "reconcile";
  payload?: unknown;
};

export type SettleResult = {
  /** The order is paid in full — safe to fulfil. */
  paid: boolean;
  /** This call is the one that flipped it to paid (only one racer wins). */
  transitioned: boolean;
  reason?: string;
};

type OrderRow = {
  id: string;
  status: string;
  total: number;
  payment_type: string | null;
  payment_status: string | null;
  customer_phone: string | null;
};

export function serviceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Number(null) is 0 and Number(undefined) is NaN — coercing blindly would turn
 * "LiqPay told us nothing" into a confident 0.00, which is exactly the kind of
 * fabricated figure the audit trail exists to prevent.
 */
function toAmount(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

async function recordEvent(
  supabase: SupabaseClient,
  input: SettleInput,
  accepted: boolean,
  reason?: string
) {
  const { error } = await supabase.from("payment_events").insert({
    order_id: input.orderId,
    source: input.source,
    status: input.status,
    amount: toAmount(input.amount),
    currency: typeof input.currency === "string" ? input.currency : null,
    accepted,
    reason: reason ?? null,
    payload: (input.payload ?? null) as never,
  });
  if (error) console.error("payments: failed to record payment_event", input.orderId, error);
}

/**
 * Single place where a LiqPay outcome is turned into an order state change.
 *
 * Both entry points (the server callback and the success-page reconcile) run
 * concurrently by design — LiqPay fires server_url and redirects the browser at
 * the same moment. The paid transition is therefore a compare-and-set that
 * PostgREST executes as one atomic UPDATE: exactly one caller gets a row back
 * and owns the notifications, so the owner never gets two Telegram messages and
 * the customer never gets two receipts for one payment.
 *
 * Throws only on infrastructure failure, so callers can return 5xx and let
 * LiqPay retry rather than silently losing a paid order.
 */
export async function settleOrderPayment(input: SettleInput): Promise<SettleResult> {
  const supabase = serviceClient();

  const { data: order, error: loadError } = await supabase
    .from("orders")
    .select("id, status, total, payment_type, payment_status, customer_phone")
    .eq("id", input.orderId)
    .maybeSingle<OrderRow>();

  if (loadError) {
    console.error("payments: order lookup failed", input.orderId, loadError);
    throw new Error("order_lookup_failed");
  }

  if (!order) {
    console.error("payments: callback for unknown order", input.orderId, input.status);
    await recordEvent(supabase, input, false, "order_not_found");
    return { paid: false, transitioned: false, reason: "order_not_found" };
  }

  const isPaidStatus = LIQPAY_PAID_STATUSES.has(input.status);

  if (!isPaidStatus) {
    await recordEvent(supabase, input, false, "status_not_paid");
    // Record what LiqPay reported without touching the order's own lifecycle.
    // Scoped to 'pending' so a late or replayed intermediate callback cannot
    // rewrite the payment record of an order that has already settled.
    await supabase
      .from("orders")
      .update({ payment_status: input.status, updated_at: new Date().toISOString() })
      .eq("id", input.orderId)
      .eq("status", "pending");

    // LiqPay has the customer's money but is holding it. Silence here reads to
    // the owner as "they never paid", so say it out loud — once per status change.
    if (LIQPAY_HELD_STATUSES.has(input.status) && order.payment_status !== input.status) {
      await alertHeld(order, input);
    }

    return { paid: false, transitioned: false, reason: "status_not_paid" };
  }

  // A "success" for the wrong amount or currency is not a paid order. Without
  // this check a checkout signed for a different sum settles silently, and
  // every operator-facing surface still shows the expected total.
  const expected = Number(order.total);
  if (input.currency !== undefined && input.currency !== null && input.currency !== "UAH") {
    await recordEvent(supabase, input, false, "currency_mismatch");
    await alertMismatch(order, input, `валюта ${String(input.currency)} замість UAH`);
    return { paid: false, transitioned: false, reason: "currency_mismatch" };
  }
  if (input.amount !== undefined && input.amount !== null && !amountMatches(input.amount, expected)) {
    await recordEvent(supabase, input, false, "amount_mismatch");
    await alertMismatch(order, input, `сплачено ${String(input.amount)} грн замість ${expected} грн`);
    return { paid: false, transitioned: false, reason: "amount_mismatch" };
  }

  await recordEvent(supabase, input, true);

  // Null when LiqPay did not tell us — better an empty column than a made-up
  // figure that looks like a verified capture.
  const paidAmount = toAmount(input.amount);

  // Compare-and-set: only a 'pending' order transitions. This both prevents the
  // double-notify race and stops a stale success-page visit from dragging an
  // order the admin already advanced (or cancelled) back to 'paid'.
  const { data: updated, error: updateError } = await supabase
    .from("orders")
    .update({
      status: "paid",
      payment_status: input.status,
      payment_id: input.paymentId || input.orderId,
      paid_amount: paidAmount,
      paid_currency: typeof input.currency === "string" ? input.currency : "UAH",
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.orderId)
    .eq("status", "pending")
    .select("id");

  if (updateError) {
    console.error("payments: paid transition failed", input.orderId, updateError);
    throw new Error("order_update_failed");
  }

  const transitioned = (updated?.length ?? 0) === 1;

  if (transitioned) {
    // A card order only counts as converted once it is actually paid. Marking
    // it at checkout time meant every abandoned card payment was excluded from
    // recovery outreach while showing up as a conversion.
    if (order.customer_phone) {
      await supabase
        .from("abandoned_checkouts")
        .update({ status: "ordered", updated_at: new Date().toISOString() })
        .eq("phone", order.customer_phone);
    }

    // The order is already committed as paid at this point. A notification
    // failure must never propagate: it would make the callback return 5xx,
    // LiqPay would retry, and the retry would find the order no longer
    // 'pending' — so the alert would be lost anyway, on top of a bogus error.
    const [notified, emailed] = await Promise.all([
      notifyPaidOrder(input.orderId).catch((err) => {
        console.error("payments: Telegram notification threw", input.orderId, err);
        return false;
      }),
      sendOrderEmail(input.orderId, "paid").catch((err) => {
        console.error("payments: customer email threw", input.orderId, err);
        return false;
      }),
    ]);
    if (!notified) console.error("payments: Telegram notification failed", input.orderId);
    if (!emailed) console.error("payments: customer email failed", input.orderId);
  }

  return { paid: true, transitioned };
}

async function alertHeld(order: OrderRow, input: SettleInput) {
  console.error("payments: FUNDS HELD", order.id, input.status);
  await sendTelegram(
    [
      `⏳ <b>Кошти утримано — замовлення ще не оплачене</b>`,
      ``,
      `📌 <b>Замовлення:</b> <code>${escapeHtml(order.id.slice(0, 8).toUpperCase())}</code>`,
      `📊 <b>Статус LiqPay:</b> ${escapeHtml(input.status)}`,
      `💰 <b>Сума:</b> ${escapeHtml(Number(order.total).toLocaleString("uk-UA"))} грн`,
      ``,
      `<i>З картки клієнта кошти вже списано, але на рахунок вони ще не зараховані.`,
      `Перевірте статус мерчанта в кабінеті LiqPay — товар поки не відправляйте.</i>`,
    ].join("\n")
  );
}

async function alertMismatch(order: OrderRow, input: SettleInput, detail: string) {
  console.error(
    "payments: PAYMENT MISMATCH",
    order.id,
    "expected",
    order.total,
    "got",
    input.amount,
    input.currency
  );
  await sendTelegram(
    [
      `⚠️ <b>Розбіжність платежу — замовлення не позначено оплаченим</b>`,
      ``,
      `📌 <b>Замовлення:</b> <code>${escapeHtml(order.id.slice(0, 8).toUpperCase())}</code>`,
      `❗️ <b>Проблема:</b> ${escapeHtml(detail)}`,
      `📊 <b>Статус LiqPay:</b> ${escapeHtml(input.status)}`,
      ``,
      `<i>Перевірте платіж у кабінеті LiqPay перед відправкою товару.</i>`,
    ].join("\n")
  );
}
