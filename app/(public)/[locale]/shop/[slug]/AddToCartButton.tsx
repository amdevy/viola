"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useCart } from "@/hooks/useCart";
import { useCartQuantity } from "@/hooks/useCartQuantity";
import { showAddedToCart } from "@/components/shop/addedToCartToast";
import { sendGAEvent } from "@/lib/analytics";
import StockNotifyModal from "@/components/shop/StockNotifyModal";
import type { Product } from "@/types";

export default function AddToCartButton({ product }: { product: Product }) {
  const t = useTranslations("productCard");
  const tc = useTranslations("common");
  const tcart = useTranslations("cart");
  const [qty, setQty] = useState(1);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const { addItem, openCart } = useCart();
  const inCartQty = useCartQuantity(product.id);

  useEffect(() => {
    sendGAEvent("event", "view_item", {
      currency: "UAH",
      value: product.price,
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_category: product.category?.name ?? undefined,
        price: product.price,
        quantity: 1,
      }],
    });
  }, [product.id, product.name, product.price, product.category?.name]);

  const canBuy = product.in_stock && !product.is_coming_soon;

  const handleAdd = () => {
    if (!canBuy) {
      setNotifyOpen(true);
      return;
    }
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] ?? "",
      quantity: qty,
      volume: product.volume ?? undefined,
    });
    sendGAEvent("event", "add_to_cart", {
      currency: "UAH",
      value: product.price * qty,
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity: qty,
      }],
    });
    // No cart sliding over the product: the line under the buttons and the
    // toast both lead to it. See addedToCartToast.tsx.
    showAddedToCart({
      title: tcart("added"),
      detail: product.name,
      openLabel: tcart("openShort"),
    });
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

      {/* Stacked on phones: side by side, the main button got ~134px and
          broke its label in two, and the out-of-stock label overflowed. */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleAdd}
          className="w-full sm:flex-1 px-4 bg-[#1A1A1A] text-white py-4 text-sm font-medium rounded hover:bg-[#C4A882] transition-colors uppercase tracking-wider"
        >
          {canBuy ? t("addToCartFull") : tc("notifyMe")}
        </button>
        <a
          href="https://t.me/violagegedosh"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            sendGAEvent("event", "telegram_consultation", {
              source: "product_page",
              product_id: product.id,
              product_name: product.name,
            });
          }}
          className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-[#1A1A1A] text-[#1A1A1A] text-sm font-medium rounded hover:bg-[#1A1A1A] hover:text-white transition-colors uppercase tracking-wider"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          {tc("consultation")}
        </a>
      </div>

      {/* Here the main button keeps adding (there is a quantity picker), so the
          way to the cart is a line of its own, shown once the product is in it. */}
      {canBuy && inCartQty > 0 && (
        <button
          type="button"
          onClick={() => openCart("product_page")}
          className="flex w-full items-center justify-center gap-2 rounded border border-[#C4A882] bg-[#FDF9F5] px-4 py-3 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F5EDE2]"
        >
          <svg
            className="h-4 w-4 flex-shrink-0 text-[#C4A882]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>{t("inCartCount", { count: inCartQty })}</span>
          <span className="text-[#C4A882]">·</span>
          <span className="underline underline-offset-2">{tcart("open")}</span>
        </button>
      )}

      <StockNotifyModal
        isOpen={notifyOpen}
        onClose={() => setNotifyOpen(false)}
        product={product}
      />
    </div>
  );
}
