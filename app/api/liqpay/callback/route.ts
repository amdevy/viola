import { NextRequest, NextResponse } from "next/server";
import { verifyCallback, decodeCallback } from "@/lib/liqpay";
import { settleOrderPayment } from "@/lib/payments";

type LiqPayCallback = {
  status: string;
  order_id: string;
  payment_id?: number;
  amount?: number;
  currency?: string;
  transaction_id?: number;
  err_code?: string;
  err_description?: string;
};

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const data = String(formData.get("data") ?? "");
  const signature = String(formData.get("signature") ?? "");

  if (!data || !signature) {
    console.error("liqpay callback: missing data or signature");
    return NextResponse.json({ status: "error", reason: "missing data" }, { status: 400 });
  }

  const privateKey = process.env.LIQPAY_PRIVATE_KEY;
  if (!privateKey) {
    console.error("liqpay callback: LIQPAY_PRIVATE_KEY is not configured");
    return NextResponse.json({ status: "error" }, { status: 500 });
  }

  // Logged loudly: if the key is ever rotated, every callback fails here and the
  // only other symptom is "nobody is paying any more" while cards are charged.
  if (!verifyCallback(data, signature, privateKey)) {
    console.error("liqpay callback: INVALID SIGNATURE — rejecting");
    return NextResponse.json({ status: "error", reason: "invalid signature" }, { status: 400 });
  }

  let payload: LiqPayCallback;
  try {
    payload = decodeCallback<LiqPayCallback>(data);
  } catch (err) {
    console.error("liqpay callback: undecodable payload", err);
    return NextResponse.json({ status: "error", reason: "bad payload" }, { status: 400 });
  }

  if (!payload.order_id) {
    console.error("liqpay callback: payload without order_id", payload.status);
    return NextResponse.json({ status: "error", reason: "missing order_id" }, { status: 400 });
  }

  try {
    await settleOrderPayment({
      orderId: payload.order_id,
      status: payload.status,
      amount: payload.amount,
      currency: payload.currency,
      paymentId: payload.payment_id ? String(payload.payment_id) : null,
      source: "callback",
      payload,
    });
  } catch (err) {
    // 5xx so LiqPay retries — a 200 here would permanently strand a paid order.
    console.error("liqpay callback: settle failed", payload.order_id, err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
}
