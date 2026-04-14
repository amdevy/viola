"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import type { CartItem as CartItemType } from "@/types";

export default function CartItem({ item }: { item: CartItemType }) {
  const { updateQuantity, removeItem } = useCart();
  const locale = useLocale();

  return (
    <div className="flex gap-3 py-3 border-b border-[#E8E4DE] last:border-0">
      {/* Image */}
      <div className="relative w-16 h-20 flex-shrink-0 rounded overflow-hidden bg-[#F0EDE8]">
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
        <p className="text-sm font-medium text-[#1A1A1A] line-clamp-2">{item.name}</p>
        {item.volume && (
          <p className="text-xs text-[#6B6B6B] mt-0.5">{item.volume}</p>
        )}
        <p className="text-sm font-semibold text-[#C4A882] mt-1">
          {formatPrice(item.price * item.quantity, locale)}
        </p>

        {/* Quantity controls */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
            className="w-6 h-6 flex items-center justify-center border border-[#E8E4DE] rounded text-[#1A1A1A] hover:border-[#C4A882] transition-colors text-sm"
          >
            −
          </button>
          <span className="text-sm w-6 text-center">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
            className="w-6 h-6 flex items-center justify-center border border-[#E8E4DE] rounded text-[#1A1A1A] hover:border-[#C4A882] transition-colors text-sm"
          >
            +
          </button>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => removeItem(item.productId)}
        className="flex-shrink-0 p-1 text-[#A0A0A0] hover:text-[#E53E3E] transition-colors"
        aria-label="Видалити"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
