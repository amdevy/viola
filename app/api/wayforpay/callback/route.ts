import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyWfpCallback } from "@/lib/wfp";
import crypto from "crypto";

function makeConfirmation(
  merchantAccount: string,
  orderReference: string,
  status: string,
  secret: string
) {
  const time = Math.floor(Date.now() / 1000);
  const params = [merchantAccount, orderReference, String(time), status];
  const signature = crypto
    .createHmac("md5", secret)
    .update(params.join(";"))
    .digest("hex");

  return {
    orderReference,
    status,
    time,
    signature,
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const secret = process.env.WFP_MERCHANT_SECRET!;
  const merchant = process.env.WFP_MERCHANT_LOGIN!;

  // Verify signature
  const isValid = verifyWfpCallback(body, secret);
  if (!isValid) {
    return NextResponse.json({ status: "ERROR" }, { status: 400 });
  }

  // Update order status if payment approved
  if (body.transactionStatus === "Approved") {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase
      .from("orders")
      .update({
        status: "paid",
        payment_status: body.transactionStatus,
        payment_id: body.orderReference,
        updated_at: new Date().toISOString(),
      })
      .eq("payment_id", body.orderReference);
  }

  const confirmation = makeConfirmation(
    merchant,
    body.orderReference,
    "accept",
    secret
  );

  return NextResponse.json(confirmation);
}
