import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyCallback, decodeCallback } from "@/lib/liqpay";
import { notifyPaidOrder } from "@/lib/notify";

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

const SUCCESS_STATUSES = new Set(["success", "sandbox", "wait_accept"]);

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const data = String(formData.get("data") ?? "");
  const signature = String(formData.get("signature") ?? "");

  if (!data || !signature) {
    return NextResponse.json({ status: "error", reason: "missing data" }, { status: 400 });
  }

  const privateKey = process.env.LIQPAY_PRIVATE_KEY!;

  if (!verifyCallback(data, signature, privateKey)) {
    return NextResponse.json({ status: "error", reason: "invalid signature" }, { status: 400 });
  }

  const payload = decodeCallback<LiqPayCallback>(data);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const isPaid = SUCCESS_STATUSES.has(payload.status);

  const { data: existing } = await supabase
    .from("orders")
    .select("status")
    .eq("id", payload.order_id)
    .single();

  const wasPaid = existing?.status === "paid";

  await supabase
    .from("orders")
    .update({
      status: isPaid ? "paid" : "pending",
      payment_status: payload.status,
      payment_id: payload.payment_id ? String(payload.payment_id) : payload.order_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.order_id);

  if (isPaid && !wasPaid) {
    await notifyPaidOrder(payload.order_id);
  }

  return NextResponse.json({ status: "ok" });
}
