"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { sendGAEvent } from "@/lib/analytics";
import { useCart } from "@/hooks/useCart";
import { formatPrice, formatVolume } from "@/lib/utils";
import type { CartItem } from "@/types";

export default function CheckoutSummary() {
  const t = useTranslations("checkout");
  const tc = useTranslations("cart");
  const locale = useLocale();
  const items = useCart((s) => s.items);
  const cartTotal = useCart((s) => s.total());
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleRemove = (item: CartItem) => {
    sendGAEvent("event", "remove_from_cart", {
      currency: "UAH",
      value: item.price * item.quantity,
      items: [
        {
          item_id: item.productId,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
        },
      ],
    });
    removeItem(item.productId);
  };

  // In one column the order sits above the form, so the shopper needs a clear
  // way on to it. From lg the form is beside the summary and this is hidden.
  const goToForm = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document
      .getElementById("checkout-form")
      ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    sendGAEvent("event", "select_content", {
      content_type: "checkout_go_to_form",
      content_id: "order_summary",
    });
  };

  return (
    <div className="bg-surface rounded border border-border p-6 lg:sticky lg:top-24">
      <h2 className="font-serif text-xl font-semibold text-foreground mb-4">
        {t("yourOrder")}
      </h2>

      <div className="space-y-4 mb-4 max-h-80 overflow-y-auto pr-1">
        {mounted &&
          items.map((item) => (
            <div key={item.productId} className="flex gap-3">
              <div className="relative w-14 h-16 flex-shrink-0 rounded overflow-hidden bg-panel">
                <Image
                  src={item.image || "/placeholder-product.png"}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">
                    {item.name}
                  </p>
                  <button
                    onClick={() => handleRemove(item)}
                    aria-label={tc("remove")}
                    className="flex-shrink-0 -mt-0.5 -mr-0.5 p-1 text-subtle hover:text-error transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {item.volume && (
                  <p className="text-[10px] text-muted mt-0.5">
                    {formatVolume(item.volume, locale)}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2 gap-2">
                  <div className="inline-flex items-center border border-border rounded overflow-hidden">
                    <button
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity - 1)
                      }
                      aria-label={tc("decrease")}
                      className="w-6 h-6 flex items-center justify-center text-foreground hover:bg-background transition-colors text-sm"
                    >
                      −
                    </button>
                    <span className="text-xs font-medium w-6 text-center tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                      aria-label={tc("increase")}
                      className="w-6 h-6 flex items-center justify-center text-foreground hover:bg-background transition-colors text-sm"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                    {formatPrice(item.price * item.quantity, locale)}
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>

      <div className="border-t border-border pt-4 space-y-2">
        <div className="flex justify-between text-sm text-muted">
          <span>{tc("summary")}</span>
          <span>{mounted ? formatPrice(cartTotal, locale) : ""}</span>
        </div>
        <div className="flex justify-between text-sm text-muted">
          <span>{tc("delivery")}</span>
          <span>{tc("deliveryRate")}</span>
        </div>
        <div className="flex justify-between font-semibold text-foreground pt-2 border-t border-border">
          <span>{tc("total")}</span>
          <span>{mounted ? formatPrice(cartTotal, locale) : ""}</span>
        </div>
      </div>

      {mounted && items.length > 0 && (
        <button
          type="button"
          onClick={goToForm}
          className="lg:hidden mt-5 flex h-12 w-full items-center justify-center gap-2 rounded bg-ink text-sm font-medium uppercase tracking-wider text-on-ink transition-colors active:bg-ink-hover"
        >
          {t("goToForm")}
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m0 0-6-6m6 6 6-6" />
          </svg>
        </button>
      )}
    </div>
  );
}
