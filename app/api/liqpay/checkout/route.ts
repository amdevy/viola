import { NextRequest, NextResponse } from "next/server";
import { buildCheckout, type LiqPayParams } from "@/lib/liqpay";

export async function POST(req: NextRequest) {
  try {
    const { orderId, items, customer } = await req.json();

    const publicKey = process.env.LIQPAY_PUBLIC_KEY!;
    const privateKey = process.env.LIQPAY_PRIVATE_KEY!;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

    const amount = items.reduce(
      (sum: number, i: { price: number; qty: number }) => sum + i.price * i.qty,
      0
    );

    const description = `Замовлення #${orderId} — Viola (${items
      .map((i: { name: string; qty: number }) => `${i.name} ×${i.qty}`)
      .join(", ")})`.slice(0, 250);

    const params: LiqPayParams = {
      public_key: publicKey,
      version: 3,
      action: "pay",
      amount: Number(amount.toFixed(2)),
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
      customer,
    });
  } catch (err) {
    console.error("LiqPay checkout error:", err);
    return NextResponse.json({ error: "Payment init failed" }, { status: 500 });
  }
}
