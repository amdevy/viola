"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useCart } from "@/hooks/useCart";
import CartItem from "./CartItem";
import { formatPrice } from "@/lib/utils";

export default function CartDrawer() {
  const t = useTranslations("cart");
  const { items, isOpen, closeCart } = useCart();
  const cartTotal = useCart((s) => s.total());
  const count = useCart((s) => s.itemCount());
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4DE]">
          <h2 className="font-serif text-xl font-bold text-[#1A1A1A]">
            {t("title")}
            {mounted && count > 0 && (
              <span className="ml-2 text-sm font-normal text-[#6B6B6B]">({count})</span>
            )}
          </h2>
          <button
            onClick={closeCart}
            className="p-2 text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6">
          {!mounted || items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <svg className="w-16 h-16 text-[#E8E4DE] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                />
              </svg>
              <p className="font-medium text-[#1A1A1A]">{t("emptyTitle")}</p>
              <p className="text-sm text-[#6B6B6B] mt-1 mb-6">{t("emptyText")}</p>
              <button
                onClick={closeCart}
                className="text-sm text-[#C4A882] underline hover:text-[#A8875E] transition-colors"
              >
                {t("continueShopping")}
              </button>
            </div>
          ) : (
            <div className="py-2">
              {items.map((item) => (
                <CartItem key={item.productId} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {mounted && items.length > 0 && (
          <div className="border-t border-[#E8E4DE] px-6 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6B6B6B]">{t("total")}</span>
              <span className="text-lg font-semibold text-[#1A1A1A]">{formatPrice(cartTotal)}</span>
            </div>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full bg-[#1A1A1A] text-white text-center text-sm font-medium py-3 rounded hover:bg-[#C4A882] transition-colors uppercase tracking-wider"
            >
              {t("placeOrder")}
            </Link>
            <button
              onClick={closeCart}
              className="block w-full text-sm text-center text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
            >
              {t("continueShopping")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
