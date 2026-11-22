"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useCart } from "@/hooks/useCart";
import { useCartQuantity } from "@/hooks/useCartQuantity";
import { formatPrice } from "@/lib/utils";
import { showAddedToCart } from "@/components/shop/addedToCartToast";
import { sendGAEvent } from "@/lib/analytics";
import StockNotifyModal from "@/components/shop/StockNotifyModal";
import type { Product } from "@/types";

export default function MobileStickyBar({ product }: { product: Product }) {
  const t = useTranslations("productCard");
  const tc = useTranslations("common");
  const tcart = useTranslations("cart");
  const locale = useLocale();
  const [visible, setVisible] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const { addItem, openCart } = useCart();
  const inCart = useCartQuantity(product.id) > 0;

  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      // The bar steps aside once the site footer reaches the strip it sits in,
      // so the footer's last links can be seen and tapped. offsetTop and
      // offsetHeight ignore the slide transform, so this is where the bar's
      // lower edge is when shown: the top of the bottom navigation on phones,
      // the bottom of the screen from md up.
      const bar = barRef.current;
      const footer = document.querySelector("footer");
      const barBottom = bar ? bar.offsetTop + bar.offsetHeight : window.innerHeight;
      const footerInView = footer ? footer.getBoundingClientRect().top < barBottom : false;
      setVisible(window.scrollY > 480 && !footerInView);
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
    // Same as the product card: once the product is in the cart this button
    // opens the cart rather than adding a second one.
    if (inCart) {
      openCart("sticky_bar");
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
    showAddedToCart({
      title: tcart("added"),
      detail: product.name,
      openLabel: tcart("openShort"),
    });
  };

  // On phones this bar rides on top of the bottom navigation (MobileBottomNav,
  // 3.5rem plus the home-indicator inset). It sits one layer below it, so when
  // it slides down to hide it disappears behind the navigation, not over it.
  return (
    <>
      <div
        ref={barRef}
        // Slid away, it is out of sight: keep it out of reach of the keyboard
        // and screen readers too.
        aria-hidden={!visible}
        inert={!visible}
        className={`lg:hidden fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] md:bottom-0 md:pb-[env(safe-area-inset-bottom)] left-0 right-0 z-30 bg-white border-t border-[#E8E4DE] shadow-[0_-4px_12px_rgba(0,0,0,0.06)] transition-transform duration-300 ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
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
            aria-label={canBuy && inCart ? t("inCartOpen") : undefined}
            className="bg-[#1A1A1A] text-white px-4 py-3 text-sm font-medium rounded uppercase tracking-wide hover:bg-[#C4A882] transition-colors whitespace-nowrap"
          >
            {!canBuy ? (
              tc("notifyMe")
            ) : inCart ? (
              <span className="inline-flex items-center gap-1.5">
                <svg
                  className="h-4 w-4 text-[#C4A882]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t("inCart")}
              </span>
            ) : (
              t("addToCartFull")
            )}
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
