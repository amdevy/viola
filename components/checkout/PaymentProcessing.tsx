"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";

/**
 * Shown while LiqPay reports a non-final status (3-D Secure, OTP, bank review)
 * or when its status API is unreachable. Deliberately offers no retry button:
 * the card may well have been charged, and a retry here is how one purchase
 * turns into two payments. Polls by re-rendering the server component.
 */
// Each poll re-runs the server component, which calls LiqPay's status API.
// Bounded so a tab left open on a held payment does not hammer it forever.
const POLL_MS = 5000;
const MAX_ELAPSED_S = 180;

export default function PaymentProcessing({ orderId }: { orderId: string }) {
  const t = useTranslations("success");
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (elapsed >= MAX_ELAPSED_S) return;
    const timer = setTimeout(() => {
      setElapsed((s) => s + POLL_MS / 1000);
      router.refresh();
    }, POLL_MS);
    return () => clearTimeout(timer);
  }, [elapsed, router]);

  const givenUp = elapsed >= MAX_ELAPSED_S;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-[#FDF9F5] border border-[#E8E4DE] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className={`w-8 h-8 text-[#C4A882] ${givenUp ? "" : "animate-spin"}`}
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
          </svg>
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#1A1A1A] mb-3">
          {t("processingTitle")}
        </h1>
        <p className="text-[#6B6B6B] mb-2">{t("processingMessage")}</p>
        <p className="text-sm text-[#A0A0A0] mb-6">
          {t("orderNumber")}{" "}
          <span className="font-mono font-medium text-[#1A1A1A]">
            {orderId.slice(0, 8).toUpperCase()}
          </span>
        </p>
        <p className="text-sm text-[#6B6B6B]">
          {givenUp
            ? t("processingSlow")
            : elapsed >= 30
            ? t("processingSlow")
            : t("processingWait")}
        </p>
        {givenUp && (
          <p className="text-sm text-[#6B6B6B] mt-4">{t("processingContactUs")}</p>
        )}
      </div>
    </div>
  );
}
