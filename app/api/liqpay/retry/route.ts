import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildCheckout, type LiqPayParams } from "@/lib/liqpay";

type OrderItemRow = {
  quantity: number;
  price: number;
  products: { name: string } | null;
};

type OrderRow = {
  id: string;
  status: string;
  total: number;
  order_items: OrderItemRow[];
};

export async function POST(req: NextRequest) {
  try {
    const { orderId } = (await req.json()) as { orderId?: string };
    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const publicKey = process.env.LIQPAY_PUBLIC_KEY!;
    const privateKey = process.env.LIQPAY_PRIVATE_KEY!;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: order, error } = await supabase
      .from("orders")
      .select("id, status, total, order_items(quantity, price, products(name))")
      .eq("id", orderId)
      .single<OrderRow>();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "paid") {
      return NextResponse.json({ error: "Order already paid" }, { status: 409 });
    }

    const itemsSummary = order.order_items
      .map((i) => `${i.products?.name ?? "—"} ×${i.quantity}`)
      .join(", ");
    const description = `Замовлення #${orderId} — Viola (${itemsSummary})`.slice(0, 250);

    const params: LiqPayParams = {
      public_key: publicKey,
      version: 3,
      action: "pay",
      amount: Number(Number(order.total).toFixed(2)),
      currency: "UAH",
      description,
      order_id: orderId,
      result_url: `${siteUrl}/checkout/success?orderId=${orderId}`,
      server_url: `${siteUrl}/api/liqpay/callback`,
      language: "uk",
      sandbox: publicKey.startsWith("sandbox_") ? 1 : 0,
    };

    const { data, signature } = buildCheckout(params, privateKey);

    return NextResponse.json({
      data,
      signature,
      action: "https://www.liqpay.ua/api/3/checkout",
    });
  } catch (err) {
    console.error("LiqPay retry error:", err);
    return NextResponse.json({ error: "Retry failed" }, { status: 500 });
  }
}
