import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendOrderEmail } from "@/lib/email";
import { escapeHtml, sendTelegram } from "@/lib/telegram";
import { rateLimitRequest } from "@/lib/rate-limit";

type OrderItemRow = {
  quantity: number;
  price: number;
  products: { name: string } | null;
};

type OrderRow = {
  id: string;
  customer_name: string;
  customer_phone: string;
  city: string;
  nova_poshta_address: string;
  total: number;
  notes: string | null;
  status: string;
  payment_type: string | null;
  order_items: OrderItemRow[];
};

/**
 * Announces a "call me back" order to the shop.
 *
 * Takes only an order id: an earlier version built the whole message from the
 * request body, so anyone could flood the owner's Telegram with orders that did
 * not exist — and once the bot hit its per-chat limit, genuine orders stopped
 * being announced.
 */
export async function POST(req: NextRequest) {
  if (!rateLimitRequest(req, "notify-callback", 10, 60_000)) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const orderId = (body as { orderId?: unknown })?.orderId;
  if (typeof orderId !== "string" || !/^[0-9a-f-]{36}$/i.test(orderId)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // Set when the shopper picked card payment but LiqPay could not be reached at
  // all. The order is real and already in the database; without this it would
  // sit forever as a pending card order nobody is going to pay.
  const cardUnavailable =
    (body as { reason?: unknown })?.reason === "card_unavailable";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, customer_name, customer_phone, city, nova_poshta_address, total, notes, status, payment_type, order_items(quantity, price, products(name))"
    )
    .eq("id", orderId)
    .maybeSingle<OrderRow>();

  if (error) {
    console.error("notify-callback: order lookup failed", orderId, error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
  if (!order) {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }

  // Scoped to a still-pending card order: if LiqPay in fact took the money in
  // the meantime, the status is no longer 'pending' and this quietly does
  // nothing rather than rewriting a paid order as a phone order.
  if (cardUnavailable && order.payment_type === "card") {
    const { error: convertError } = await supabase
      .from("orders")
      .update({ payment_type: "callback", updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .eq("status", "pending")
      .eq("payment_type", "card");
    if (convertError) {
      console.error("notify-callback: card→callback conversion failed", orderId, convertError);
    }
  }

  // Awaited, not fire-and-forget: on a serverless platform the instance is
  // frozen the moment the response is returned, so a detached promise routinely
  // never reaches Resend and the customer gets no confirmation at all.
  const emailed = await sendOrderEmail(orderId, "callback").catch((err) => {
    console.error("notify-callback: email failed", err);
    return false;
  });

  const itemLines = order.order_items
    .map(
      (i) =>
        `  • ${escapeHtml(i.products?.name ?? "—")} × ${escapeHtml(i.quantity)} — ${escapeHtml(
          (i.price * i.quantity).toLocaleString("uk-UA")
        )} грн`
    )
    .join("\n");

  const text = [
    cardUnavailable
      ? `📦 <b>Нове замовлення — оплата карткою не запустилась</b>`
      : `📦 <b>Нове замовлення — зворотній зв'язок</b>`,
    ``,
    `👤 <b>Клієнт:</b> ${escapeHtml(order.customer_name)}`,
    `📞 <b>Телефон:</b> ${escapeHtml(order.customer_phone)}`,
    ``,
    `🏙 <b>Місто:</b> ${escapeHtml(order.city)}`,
    `🏢 <b>Відділення:</b> ${escapeHtml(order.nova_poshta_address)}`,
    ``,
    `🛍 <b>Товари:</b>`,
    itemLines,
    ``,
    `💰 <b>Сума:</b> ${escapeHtml(Number(order.total).toLocaleString("uk-UA"))} грн`,
    order.notes ? `📝 <b>Коментар:</b> ${escapeHtml(order.notes)}` : null,
    ``,
    `📌 <b>ID замовлення:</b> <code>${escapeHtml(order.id.slice(0, 8).toUpperCase())}</code>`,
    ``,
    cardUnavailable
      ? `<i>Клієнт обрав оплату карткою, але LiqPay був недоступний. Замовлення переведено у зворотній зв'язок — зателефонуйте й узгодьте оплату.</i>`
      : `<i>Клієнт бажає, щоб з ним зв'язалися.</i>`,
    emailed ? null : `⚠️ <i>Лист клієнту не надіслано.</i>`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const sent = await sendTelegram(text);
  if (!sent) {
    return NextResponse.json({ error: "notify_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
