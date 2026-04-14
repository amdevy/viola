"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCart } from "@/hooks/useCart";
import toast from "react-hot-toast";
import type { Product } from "@/types";

export default function AddToCartButton({ product }: { product: Product }) {
  const t = useTranslations("productCard");
  const tc = useTranslations("common");
  const [qty, setQty] = useState(1);
  const { addItem, openCart } = useCart();

  const handleAdd = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] ?? "",
      quantity: qty,
      volume: product.volume ?? undefined,
    });
    toast.success(`${product.name} ${t("addedToCart")}`);
    openCart();
  };

  return (
    <div className="space-y-4">
      {/* Qty selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-[#6B6B6B]">{t("quantity")}</label>
        <div className="flex items-center border border-[#E8E4DE] rounded">
          <button
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="w-10 h-10 flex items-center justify-center text-[#1A1A1A] hover:bg-[#F0EDE8] transition-colors"
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-medium">{qty}</span>
          <button
            onClick={() => setQty(qty + 1)}
            className="w-10 h-10 flex items-center justify-center text-[#1A1A1A] hover:bg-[#F0EDE8] transition-colors"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleAdd}
          disabled={!product.in_stock}
          className="flex-1 bg-[#1A1A1A] text-white py-4 text-sm font-medium rounded hover:bg-[#C4A882] transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
        >
          {product.in_stock ? t("addToCartFull") : t("outOfStock")}
        </button>
        <a
          href="https://t.me/violagegedosh"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-[#1A1A1A] text-[#1A1A1A] text-sm font-medium rounded hover:bg-[#1A1A1A] hover:text-white transition-colors uppercase tracking-wider"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          {tc("consultation")}
        </a>
      </div>
    </div>
  );
}
