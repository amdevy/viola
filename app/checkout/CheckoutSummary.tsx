"use client";

import Image from "next/image";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";

export default function CheckoutSummary() {
  const items = useCart((s) => s.items);
  const cartTotal = useCart((s) => s.total());

  return (
    <div className="bg-white rounded border border-[#E8E4DE] p-6 sticky top-24">
      <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
        Ваше замовлення
      </h2>

      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {items.map((item) => (
          <div key={item.productId} className="flex gap-3">
            <div className="relative w-12 h-14 flex-shrink-0 rounded overflow-hidden bg-[#F0EDE8]">
              <Image
                src={item.image || "/placeholder-product.png"}
                alt={item.name}
                fill
                className="object-cover"
                sizes="48px"
              />
              <span className="absolute -top-1 -right-1 bg-[#C4A882] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#1A1A1A] line-clamp-2">{item.name}</p>
              {item.volume && <p className="text-[10px] text-[#6B6B6B]">{item.volume}</p>}
            </div>
            <div className="text-xs font-medium text-[#1A1A1A] whitespace-nowrap">
              {formatPrice(item.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-[#E8E4DE] pt-4 space-y-2">
        <div className="flex justify-between text-sm text-[#6B6B6B]">
          <span>Підсумок</span>
          <span>{formatPrice(cartTotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-[#6B6B6B]">
          <span>Доставка</span>
          <span>За тарифами НП</span>
        </div>
        <div className="flex justify-between font-semibold text-[#1A1A1A] pt-2 border-t border-[#E8E4DE]">
          <span>Разом</span>
          <span>{formatPrice(cartTotal)}</span>
        </div>
      </div>
    </div>
  );
}
