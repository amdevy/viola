import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  assertLiqPayEnv,
  buildCheckout,
  fetchLiqPayStatus,
  isSandboxKey,
  isTerminalFailure,
  type LiqPayParams,
} from "@/lib/liqpay";
import { rateLimitRequest } from "@/lib/rate-limit";

type OrderItemRow = {
  quantity: number;
  price: number;
  products: { name: string } | null;
};

type OrderRow = {
  id: string;
  status: string;
  total: number;
  payment_type: string | null;
  locale: string | null;
  order_items: OrderItemRow[];
};

export async function POST(req: NextRequest) {
  try {
    if (!rateLimitRequest(req, "liqpay-retry", 10, 60_000)) {
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

    const { publicKey, privateKey, siteUrl } = assertLiqPayEnv();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: order, error } = await supabase
      .from("orders")
      .select(
        "id, status, total, payment_type, locale, order_items(quantity, price, products(name))"
      )
      .eq("id", orderId)
      .single<OrderRow>();

    if (error || !order) {
      return NextResponse.json({ error: "order_not_found" }, { status: 404 });
    }

    // Only a card order still awaiting payment may be re-armed. Gating on
    // "not already paid" was not enough: a refunded order sits at 'cancelled',
    // and a customer still holding the old success URL could pay it a second
    // time. Same for orders the admin has already shipped.
    if (order.status !== "pending" || order.payment_type !== "card") {
      return NextResponse.json({ error: "order_not_payable" }, { status: 409 });
    }

    const amount = Number(Number(order.total).toFixed(2));
    if (!(amount > 0)) {
      return NextResponse.json({ error: "order_not_payable" }, { status: 409 });
    }

    // 'pending' in our database only means "we were never told it succeeded" —
    // a payment awaiting bank-app or 3-D Secure confirmation looks identical.
    // Ask LiqPay before re-arming, so a stale tab cannot charge the card twice.
    // A previous attempt that LiqPay has no record of returns an error status,
    // which is not a terminal failure of a real payment — allow those through.
    try {
      const live = await fetchLiqPayStatus(orderId, publicKey, privateKey);
      const noSuchPayment = Boolean(live.err_code) && !live.payment_id;
      if (!noSuchPayment && !isTerminalFailure(live.status)) {
        return NextResponse.json({ error: "payment_in_progress" }, { status: 409 });
      }
    } catch (err) {
      // If we cannot confirm the payment is dead, refuse rather than risk a
      // double charge — the customer can retry once LiqPay answers again.
      console.error("LiqPay retry: status check failed", orderId, err);
      return NextResponse.json({ error: "status_unavailable" }, { status: 503 });
    }

    const itemsSummary = order.order_items
      .map((i) => `${i.products?.name ?? "—"} ×${i.quantity}`)
      .join(", ");
    const description = `Замовлення #${orderId} — Viola (${itemsSummary})`.slice(0, 250);

    const locale = order.locale === "en" ? "en" : "uk";
    const localePrefix = locale === "en" ? "/en" : "";

    const params: LiqPayParams = {
      public_key: publicKey,
      version: 3,
      action: "pay",
      amount,
      currency: "UAH",
      description,
      order_id: orderId,
      result_url: `${siteUrl}${localePrefix}/checkout/success?orderId=${orderId}`,
      server_url: `${siteUrl}/api/liqpay/callback`,
      language: locale,
      sandbox: isSandboxKey(publicKey) ? 1 : 0,
    };

    const { data, signature } = buildCheckout(params, privateKey);

    return NextResponse.json({
      data,
      signature,
      action: "https://www.liqpay.ua/api/3/checkout",
    });
  } catch (err) {
    console.error("LiqPay retry error:", err);
    return NextResponse.json({ error: "retry_failed" }, { status: 500 });
  }
}
