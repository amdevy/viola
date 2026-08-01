import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import type { Metadata } from "next";
import ClearCartOnSuccess from "@/components/checkout/ClearCartOnSuccess";

import { fetchLiqPayStatus, isTerminalFailure } from "@/lib/liqpay";
import { serviceClient, settleOrderPayment } from "@/lib/payments";
import PaymentFailed from "@/components/checkout/PaymentFailed";
import PaymentProcessing from "@/components/checkout/PaymentProcessing";

type OrderState = {
  paymentType: string | null;
  isPaid: boolean;
  /** The payment is still moving — never offer a retry in this state. */
  isProcessing: boolean;
};

/**
 * Reconciles a card order against LiqPay's status API, as a backstop for the
 * server callback (which cannot reach a local dev server, and which can be lost
 * in production). The actual state change goes through settleOrderPayment, so
 * this races the callback safely and cannot notify twice.
 */
async function getOrderState(orderId: string): Promise<OrderState> {
  const publicKey = process.env.LIQPAY_PUBLIC_KEY;
  const privateKey = process.env.LIQPAY_PRIVATE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return { paymentType: null, isPaid: false, isProcessing: false };
  }

  const supabase = serviceClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, status, payment_type")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    // A failed read is not "no such order". Treat it as a callback order so the
    // shopper still gets a confirmation and an emptied cart, rather than being
    // left staring at a full cart because Supabase blipped.
    console.error("success page: order lookup failed", orderId, error);
    return { paymentType: "callback", isPaid: false, isProcessing: false };
  }

  if (!order) return { paymentType: null, isPaid: false, isProcessing: false };

  // Only a still-pending card order needs reconciling. Anything the admin has
  // already advanced (processing/shipped/cancelled) must not be rewritten by a
  // customer re-opening this URL from their history days later.
  if (order.payment_type !== "card" || order.status !== "pending") {
    return {
      paymentType: order.payment_type,
      isPaid: order.status !== "pending" && order.status !== "cancelled",
      isProcessing: false,
    };
  }

  if (!publicKey || !privateKey) {
    return { paymentType: order.payment_type, isPaid: false, isProcessing: false };
  }

  try {
    const result = await fetchLiqPayStatus(orderId, publicKey, privateKey);

    // Always recorded, including non-final statuses — that is the audit trail,
    // and it is what lets the owner be alerted when funds are held.
    const settled = await settleOrderPayment({
      orderId,
      status: result.status,
      amount: result.amount,
      currency: result.currency,
      paymentId: result.payment_id ? String(result.payment_id) : null,
      source: "reconcile",
      payload: result,
    });

    if (settled.paid) {
      return { paymentType: order.payment_type, isPaid: true, isProcessing: false };
    }

    // Only an explicit terminal failure earns the failure screen with its retry
    // button. Anything else — including a status LiqPay added since this was
    // written, and an amount mismatch we refused to settle — is shown as still
    // processing, because retrying an in-flight payment charges the card twice.
    return {
      paymentType: order.payment_type,
      isPaid: false,
      isProcessing: !isTerminalFailure(result.status),
    };
  } catch (err) {
    // A timeout or a LiqPay outage says nothing about whether the card was
    // charged, so show the neutral "being confirmed" screen rather than telling
    // a customer who just paid that their payment failed.
    console.error("LiqPay status reconcile failed:", err);
    return { paymentType: order.payment_type, isPaid: false, isProcessing: true };
  }
}

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

  const orderState = orderId
    ? await getOrderState(orderId)
    : { paymentType: null, isPaid: false, isProcessing: false };

  if (orderId && orderState.isProcessing) {
    return <PaymentProcessing orderId={orderId} />;
  }

  if (orderId && orderState.paymentType === "card" && !orderState.isPaid) {
    return <PaymentFailed orderId={orderId} />;
  }

  const shouldClearCart = orderState.isPaid || orderState.paymentType === "callback";

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      {shouldClearCart && <ClearCartOnSuccess orderId={orderId} isPaid={orderState.isPaid} />}
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
