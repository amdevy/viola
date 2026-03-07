import { NextRequest, NextResponse } from "next/server";
import { Wayforpay } from "wayforpay-ts-integration";
import type { TCartElement } from "wayforpay-ts-integration";

export async function POST(req: NextRequest) {
  try {
    const { orderId, items, customer } = await req.json();

    const wfp = new Wayforpay({
      merchantLogin: process.env.WFP_MERCHANT_LOGIN!,
      merchantSecret: process.env.WFP_MERCHANT_SECRET!,
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
    const domain = new URL(siteUrl).hostname;

    const cart: TCartElement[] = items.map(
      (i: { name: string; price: number; qty: number }) => ({
        product: { name: i.name, price: i.price },
        quantity: i.qty,
      })
    );

    const form = await wfp.purchase(cart, {
      domain,
      currency: "UAH",
      orderReference: orderId,
      returnUrl: `${siteUrl}/checkout/success?orderId=${orderId}`,
      serviceUrl: `${siteUrl}/api/wayforpay/callback`,
      clientFirstName: customer.name.split(" ")[0] ?? customer.name,
      clientLastName: customer.name.split(" ")[1] ?? "",
      clientPhone: customer.phone,
      clientEmail: customer.email ?? "",
      language: "UA",
    });

    return new NextResponse(form, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    console.error("WFP checkout error:", err);
    return NextResponse.json({ error: "Payment init failed" }, { status: 500 });
  }
}
