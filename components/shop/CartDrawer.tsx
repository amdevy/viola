"use client";

import { useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { sendGAEvent } from "@/lib/analytics";
import { useCart } from "@/hooks/useCart";
import { useHasMounted } from "@/hooks/useCartQuantity";
import CartItem from "./CartItem";
import CartRecommendations from "./CartRecommendations";
import MasterAdviceNote from "./MasterAdviceNote";
import { formatPrice } from "@/lib/utils";

export default function CartDrawer() {
  const t = useTranslations("cart");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { items, isOpen, closeCart } = useCart();
  const cartTotal = useCart((s) => s.total());
  const count = useCart((s) => s.itemCount());
  const mounted = useHasMounted();

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // One view_cart per opening, with the way the cart was opened as `method`.
  // Read from the store rather than depending on the items: changing a
  // quantity in the open drawer is not another view of the cart.
  useEffect(() => {
    if (!isOpen) return;
    const { items: current, total, openMethod } = useCart.getState();
    if (current.length === 0) return;
    sendGAEvent("event", "view_cart", {
      currency: "UAH",
      value: total(),
      ...(openMethod ? { method: openMethod } : {}),
      items: current.map((i) => ({
        item_id: i.productId,
        item_name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
    });
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
        data-cart-drawer
        // The shadow only while open: parked off-screen, its blur fell back
        // onto the page as a grey band down the right edge.
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0 shadow-2xl" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-6 py-4 border-b border-[#E8E4DE]">
          <h2 className="font-serif text-xl font-bold text-[#1A1A1A]">
            {t("title")}
            {mounted && count > 0 && (
              <span className="ml-2 text-sm font-normal text-[#6B6B6B]">({count})</span>
            )}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="p-2 text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
            aria-label={t("close")}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* One scroll area between the pinned header and footer: the cart's own
            products first, the suggestions after them. With the suggestions
            outside it, four always-visible upsell rows left room for little
            more than one product of the cart itself. */}
        <div data-cart-scroll className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {!mounted || items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
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
            <>
              <div className="px-6 py-2">
                {items.map((item) => (
                  <CartItem key={item.productId} item={item} />
                ))}
              </div>
              <CartRecommendations variant="drawer" />
            </>
          )}
        </div>

        {/* Footer */}
        {mounted && items.length > 0 && (
          <div className="shrink-0 border-t border-[#E8E4DE] px-6 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6B6B6B]">{t("total")}</span>
              <span className="text-lg font-semibold text-[#1A1A1A]">{formatPrice(cartTotal, locale)}</span>
            </div>
            <MasterAdviceNote text={tc("masterAdvice")} />
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full bg-[#1A1A1A] text-white text-center text-sm font-medium py-3 rounded hover:bg-[#C4A882] transition-colors uppercase tracking-wider"
            >
              {t("placeOrder")}
            </Link>
            {/* A full-size button, not a line of grey text: on a phone this is
                the way back to the shop that a thumb can reach — the close
                icon is in the far top corner. */}
            <button
              onClick={closeCart}
              className="block w-full rounded border border-[#E8E4DE] py-3 text-center text-sm font-medium text-[#1A1A1A] transition-colors hover:border-[#C4A882]"
            >
              {t("continueShopping")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
