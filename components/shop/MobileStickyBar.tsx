"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import { sendGAEvent } from "@next/third-parties/google";
import StockNotifyModal from "@/components/shop/StockNotifyModal";
import type { Product } from "@/types";

export default function MobileStickyBar({ product }: { product: Product }) {
  const t = useTranslations("productCard");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [visible, setVisible] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const { addItem, openCart } = useCart();

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 480);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      quantity: 1,
      volume: product.volume ?? undefined,
    });
    sendGAEvent("event", "add_to_cart", {
      currency: "UAH",
      value: product.price,
      source: "mobile_sticky_bar",
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity: 1,
      }],
    });
    toast.success(`${product.name} ${t("addedToCart")}`);
    openCart();
  };

  return (
    <>
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E8E4DE] shadow-[0_-4px_12px_rgba(0,0,0,0.06)] transition-transform duration-300 ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#6B6B6B] truncate">{product.name}</p>
            <p className="text-base font-bold text-[#1A1A1A]">
              {formatPrice(product.price, locale)}
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="bg-[#1A1A1A] text-white px-5 py-3 text-sm font-medium rounded uppercase tracking-wider hover:bg-[#C4A882] transition-colors whitespace-nowrap"
          >
            {canBuy ? t("addToCart") : tc("notifyMe")}
          </button>
        </div>
      </div>
      <StockNotifyModal
        isOpen={notifyOpen}
        onClose={() => setNotifyOpen(false)}
        product={product}
      />
    </>
  );
}
