"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import toast from "react-hot-toast";

export default function PaymentFailed({ orderId }: { orderId: string }) {
  const t = useTranslations("success");
  const [loading, setLoading] = useState(false);

  const handleRetry = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/liqpay/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      // The API answers with machine-readable codes, not display text.
      if (!res.ok) throw new Error(t("retryFailed"));

      const { data, signature, action } = await res.json();

      const form = document.createElement("form");
      form.method = "POST";
      form.action = action;
      form.acceptCharset = "utf-8";

      const dataInput = document.createElement("input");
      dataInput.type = "hidden";
      dataInput.name = "data";
      dataInput.value = data;
      form.appendChild(dataInput);

      const sigInput = document.createElement("input");
      sigInput.type = "hidden";
      sigInput.name = "signature";
      sigInput.value = signature;
      form.appendChild(sigInput);

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("retryFailed"));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-[#FED7D7] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-[#E53E3E]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#1A1A1A] mb-3">
          {t("failedTitle")}
        </h1>
        <p className="text-[#6B6B6B] mb-2">{t("failedMessage")}</p>
        <p className="text-sm text-[#A0A0A0] mb-6">
          {t("orderNumber")}{" "}
          <span className="font-mono font-medium text-[#1A1A1A]">
            {orderId.slice(0, 8).toUpperCase()}
          </span>
        </p>
        <p className="text-sm text-[#6B6B6B] mb-8">{t("failedSupport")}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleRetry}
            disabled={loading}
            className="inline-flex items-center justify-center bg-[#1A1A1A] text-white px-8 py-3 text-sm font-medium rounded hover:bg-[#C4A882] transition-colors disabled:opacity-50"
          >
            {loading ? t("retrying") : t("failedRetry")}
          </button>
          <Link
            href="/cart"
            className="inline-flex items-center justify-center border border-[#E8E4DE] text-[#1A1A1A] px-8 py-3 text-sm font-medium rounded hover:border-[#C4A882] transition-colors"
          >
            {t("goHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
