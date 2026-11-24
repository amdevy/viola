"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { sendGAEvent } from "@/lib/analytics";
import { useCart } from "@/hooks/useCart";
import { formatPrice, formatVolume } from "@/lib/utils";
import type { CartItem as CartItemType } from "@/types";

export default function CartItem({ item }: { item: CartItemType }) {
  const { updateQuantity, removeItem } = useCart();
  const locale = useLocale();
  const t = useTranslations("cart");

  const handleRemove = () => {
    sendGAEvent("event", "remove_from_cart", {
      currency: "UAH",
      value: item.price * item.quantity,
      items: [{
        item_id: item.productId,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      }],
    });
    removeItem(item.productId);
  };

  return (
    <div className="flex gap-3 py-3 border-b border-border last:border-0">
      {/* Image */}
      <div className="relative w-16 h-20 flex-shrink-0 rounded overflow-hidden bg-panel">
        <Image
          src={item.image || "/placeholder-product.png"}
          alt={item.name}
          fill
          className="object-cover"
          sizes="64px"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground line-clamp-2">{item.name}</p>
        {item.volume && (
          <p className="text-xs text-muted mt-0.5">{formatVolume(item.volume, locale)}</p>
        )}
        <p className="text-sm font-semibold text-accent mt-1">
          {formatPrice(item.price * item.quantity, locale)}
        </p>

        {/* Quantity controls: 36px squares, a target a thumb hits on the
            first try; the 24px ones they replace were often missed. */}
        <div className="flex items-center gap-1 mt-1.5">
          <button
            type="button"
            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
            aria-label={t("decrease")}
            className="w-9 h-9 flex items-center justify-center border border-border rounded text-foreground hover:border-accent transition-colors text-base"
          >
            −
          </button>
          <span className="text-sm w-8 text-center" aria-live="polite">{item.quantity}</span>
          <button
            type="button"
            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
            aria-label={t("increase")}
            className="w-9 h-9 flex items-center justify-center border border-border rounded text-foreground hover:border-accent transition-colors text-base"
          >
            +
          </button>
        </div>
      </div>

      {/* Remove: a 36px target; the negative margins keep the cross where the
          small icon used to sit, so the row does not grow. */}
      <button
        type="button"
        onClick={handleRemove}
        className="flex-shrink-0 -mr-2 -mt-2 flex h-9 w-9 items-center justify-center text-subtle hover:text-error transition-colors"
        aria-label={t("remove")}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
