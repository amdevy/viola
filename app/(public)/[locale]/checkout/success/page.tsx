import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import type { Metadata } from "next";
import ClearCartOnSuccess from "@/components/checkout/ClearCartOnSuccess";

// LiqPay reconcile temporarily disabled — pending MonoPay integration
// import { createClient } from "@supabase/supabase-js";
// import { fetchLiqPayStatus } from "@/lib/liqpay";
// import { notifyPaidOrder } from "@/lib/notify";
// import { sendOrderEmail } from "@/lib/email";
// import PaymentFailed from "@/components/checkout/PaymentFailed";

// const PAID_STATUSES = new Set(["success", "sandbox", "wait_accept"]);

// async function getOrderState(
//   orderId: string
// ): Promise<{ paymentType: string | null; isPaid: boolean }> {
//   const publicKey = process.env.LIQPAY_PUBLIC_KEY;
//   const privateKey = process.env.LIQPAY_PRIVATE_KEY;
//   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
//   const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
//   if (!supabaseUrl || !serviceKey) return { paymentType: null, isPaid: false };
//
//   const supabase = createClient(supabaseUrl, serviceKey);
//   const { data: order } = await supabase
//     .from("orders")
//     .select("id, status, payment_type")
//     .eq("id", orderId)
//     .single();
//
//   if (!order) return { paymentType: null, isPaid: false };
//
//   if (order.payment_type !== "card" || order.status === "paid") {
//     return { paymentType: order.payment_type, isPaid: order.status === "paid" };
//   }
//
//   if (!publicKey || !privateKey) {
//     return { paymentType: order.payment_type, isPaid: false };
//   }
//
//   try {
//     const result = await fetchLiqPayStatus(orderId, publicKey, privateKey);
//     const isPaid = PAID_STATUSES.has(result.status);
//     await supabase
//       .from("orders")
//       .update({
//         status: isPaid ? "paid" : order.status,
//         payment_status: result.status,
//         payment_id: result.payment_id ? String(result.payment_id) : orderId,
//         updated_at: new Date().toISOString(),
//       })
//       .eq("id", orderId);
//
//     if (isPaid) {
//       await Promise.all([
//         notifyPaidOrder(orderId),
//         sendOrderEmail(orderId, "paid"),
//       ]);
//     }
//     return { paymentType: order.payment_type, isPaid };
//   } catch (err) {
//     console.error("LiqPay status reconcile failed:", err);
//     return { paymentType: order.payment_type, isPaid: false };
//   }
// }

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "success" });
  return {
    title: t("title"),
    robots: { index: false },
  };
}

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { locale } = await params;
  const { orderId } = await searchParams;
  const t = await getTranslations({ locale, namespace: "success" });

  // LiqPay reconcile disabled — all current orders are "callback" payment_type
  const shouldClearCart = Boolean(orderId);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      {shouldClearCart && <ClearCartOnSuccess />}
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-[#C6F6D5] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[#38A169]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#1A1A1A] mb-3">
          {t("title")}
        </h1>
        <p className="text-[#6B6B6B] mb-2">
          {t("orderAccepted")}
        </p>
        {orderId && (
          <p className="text-sm text-[#A0A0A0] mb-6">
            {t("orderNumber")} <span className="font-mono font-medium text-[#1A1A1A]">{orderId.slice(0, 8).toUpperCase()}</span>
          </p>
        )}
        <p className="text-sm text-[#6B6B6B] mb-6">
          {t("willContact")}
        </p>
        <p className="text-sm text-[#6B6B6B] mb-8">
          {t("reviewPrompt")}{" "}
          <Link
            href="/reviews"
            className="text-[#C4A882] hover:underline font-medium"
          >
            {t("googleReview")}
          </Link>
          {" "}{t("reviewTime")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center bg-[#1A1A1A] text-white px-8 py-3 text-sm font-medium rounded hover:bg-[#C4A882] transition-colors"
          >
            {t("continueShopping")}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center border border-[#E8E4DE] text-[#1A1A1A] px-8 py-3 text-sm font-medium rounded hover:border-[#C4A882] transition-colors"
          >
            {t("goHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
