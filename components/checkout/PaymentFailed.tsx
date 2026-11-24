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
        <div className="w-16 h-16 bg-[#FED7D7] dark:bg-error/15 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-error"
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
        <h1 className="font-serif text-3xl font-bold text-foreground mb-3">
          {t("failedTitle")}
        </h1>
        <p className="text-muted mb-2">{t("failedMessage")}</p>
        <p className="text-sm text-subtle mb-6">
          {t("orderNumber")}{" "}
          <span className="font-mono font-medium text-foreground">
            {orderId.slice(0, 8).toUpperCase()}
          </span>
        </p>
        <p className="text-sm text-muted mb-8">{t("failedSupport")}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleRetry}
            disabled={loading}
            className="inline-flex items-center justify-center bg-ink text-on-ink px-8 py-3 text-sm font-medium rounded hover:bg-accent transition-colors disabled:opacity-50"
          >
            {loading ? t("retrying") : t("failedRetry")}
          </button>
          <Link
            href="/cart"
            className="inline-flex items-center justify-center border border-border text-foreground px-8 py-3 text-sm font-medium rounded hover:border-accent transition-colors"
          >
            {t("goHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
