"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { sendGAEvent } from "@next/third-parties/google";
import { useCart } from "@/hooks/useCart";
import { useCardPaymentUnlock } from "@/hooks/useCardPaymentUnlock";
import { formatPrice, formatVolume } from "@/lib/utils";
import type { CartItem } from "@/types";
import toast from "react-hot-toast";

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

  const tapUnlock = useCardPaymentUnlock((s) => s.tap);

  const handleTotalTap = () => {
    if (tapUnlock()) toast.success(t("cardUnlocked"));
  };

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

  return (
    <div className="bg-white rounded border border-[#E8E4DE] p-6 sticky top-24">
      <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
        {t("yourOrder")}
      </h2>

      <div className="space-y-4 mb-4 max-h-80 overflow-y-auto pr-1">
        {mounted &&
          items.map((item) => (
            <div key={item.productId} className="flex gap-3">
              <div className="relative w-14 h-16 flex-shrink-0 rounded overflow-hidden bg-[#F0EDE8]">
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
                  <p className="text-xs font-medium text-[#1A1A1A] line-clamp-2 leading-snug">
                    {item.name}
                  </p>
                  <button
                    onClick={() => handleRemove(item)}
                    aria-label={tc("remove")}
                    className="flex-shrink-0 -mt-0.5 -mr-0.5 p-1 text-[#A0A0A0] hover:text-[#E53E3E] transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {item.volume && (
                  <p className="text-[10px] text-[#6B6B6B] mt-0.5">
                    {formatVolume(item.volume, locale)}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2 gap-2">
                  <div className="inline-flex items-center border border-[#E8E4DE] rounded overflow-hidden">
                    <button
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity - 1)
                      }
                      aria-label={tc("decrease")}
                      className="w-6 h-6 flex items-center justify-center text-[#1A1A1A] hover:bg-[#FAFAF8] transition-colors text-sm"
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
                      className="w-6 h-6 flex items-center justify-center text-[#1A1A1A] hover:bg-[#FAFAF8] transition-colors text-sm"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs font-semibold text-[#1A1A1A] whitespace-nowrap">
                    {formatPrice(item.price * item.quantity, locale)}
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>

      <div className="border-t border-[#E8E4DE] pt-4 space-y-2">
        <div className="flex justify-between text-sm text-[#6B6B6B]">
          <span>{tc("summary")}</span>
          <span>{mounted ? formatPrice(cartTotal, locale) : ""}</span>
        </div>
        <div className="flex justify-between text-sm text-[#6B6B6B]">
          <span>{tc("delivery")}</span>
          <span>{tc("deliveryRate")}</span>
        </div>
        {/* Tapping this row ten times in quick succession reveals card payment
            (see hooks/useCardPaymentUnlock) — a testing hatch until production
            LiqPay keys are configured. */}
        <div
          onClick={handleTotalTap}
          className="flex justify-between font-semibold text-[#1A1A1A] pt-2 border-t border-[#E8E4DE] select-none"
        >
          <span>{tc("total")}</span>
          <span>{mounted ? formatPrice(cartTotal, locale) : ""}</span>
        </div>
      </div>
    </div>
  );
}
