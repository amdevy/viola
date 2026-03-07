"use client";

import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import toast from "react-hot-toast";
import type { Product } from "@/types";

export default function AddToCartButton({ product }: { product: Product }) {
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
    toast.success(`${product.name} додано до кошика`);
    openCart();
  };

  return (
    <div className="space-y-4">
      {/* Qty selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-[#6B6B6B]">Кількість:</label>
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

      <button
        onClick={handleAdd}
        disabled={!product.in_stock}
        className="w-full bg-[#1A1A1A] text-white py-4 text-sm font-medium rounded hover:bg-[#C4A882] transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
      >
        {product.in_stock ? "Додати до кошика" : "Немає в наявності"}
      </button>
    </div>
  );
}
