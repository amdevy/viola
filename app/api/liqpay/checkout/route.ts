import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { assertLiqPayEnv, buildCheckout, isSandboxKey, type LiqPayParams } from "@/lib/liqpay";
import { rateLimitRequest } from "@/lib/rate-limit";

type OrderItemRow = { quantity: number; products: { name: string } | null };

type OrderRow = {
  id: string;
  status: string;
  total: number;
  payment_type: string | null;
  locale: string | null;
  order_items: OrderItemRow[];
};

/**
 * Returns the signed LiqPay form data for an existing unpaid order.
 *
 * The amount is read from the order row and nothing else. An earlier version
 * summed prices supplied in the request body, which let a caller pair a real
 * order id with a 1 UAH item list and pay 1 UAH for it — invisibly, because
 * every operator-facing surface reads orders.total from the database.
 */
export async function POST(req: NextRequest) {
  try {
    if (!rateLimitRequest(req, "liqpay-checkout", 20, 60_000)) {
      return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
    }

    const { publicKey, privateKey, siteUrl } = assertLiqPayEnv();

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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: order, error } = await supabase
      .from("orders")
      .select("id, status, total, payment_type, locale, order_items(quantity, products(name))")
      .eq("id", orderId)
      .single<OrderRow>();

    if (error || !order) {
      return NextResponse.json({ error: "order_not_found" }, { status: 404 });
    }
    if (order.status !== "pending") {
      return NextResponse.json({ error: "order_not_payable" }, { status: 409 });
    }

    const amount = Number(Number(order.total).toFixed(2));
    if (!(amount > 0)) {
      return NextResponse.json({ error: "order_not_payable" }, { status: 409 });
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
    console.error("LiqPay checkout error:", err);
    return NextResponse.json({ error: "payment_init_failed" }, { status: 500 });
  }
}
