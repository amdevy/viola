"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useCart } from "@/hooks/useCart";
import CartItem from "@/components/shop/CartItem";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const t = useTranslations("cart");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { items, clearCart } = useCart();
  const cartTotal = useCart((s) => s.total());
  const count = useCart((s) => s.itemCount());

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-serif text-3xl font-bold text-[#1A1A1A] mb-2">{t("title")}</h1>
      <p className="text-[#6B6B6B] mb-8">{t("itemCount", { count })}</p>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-16 h-16 text-[#E8E4DE] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
            />
          </svg>
          <p className="text-lg font-medium text-[#1A1A1A] mb-2">{t("emptyTitle")}</p>
          <p className="text-[#6B6B6B] mb-6">{t("emptyText")}</p>
          <Link
            href="/shop"
            className="inline-flex bg-[#1A1A1A] text-white px-8 py-3 text-sm font-medium rounded hover:bg-[#C4A882] transition-colors"
          >
            {tc("goToShop")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded border border-[#E8E4DE] p-4">
              {items.map((item) => (
                <CartItem key={item.productId} item={item} />
              ))}
            </div>
            <button
              onClick={clearCart}
              className="mt-4 text-sm text-[#A0A0A0] hover:text-[#E53E3E] transition-colors underline"
            >
              {t("clearCart")}
            </button>
          </div>

          {/* Summary */}
          <div>
            <div className="bg-white rounded border border-[#E8E4DE] p-6 sticky top-24">
              <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">{t("summary")}</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm text-[#6B6B6B]">
                  <span>{t("products", { count })}</span>
                  <span>{formatPrice(cartTotal, locale)}</span>
                </div>
                <div className="flex justify-between text-sm text-[#6B6B6B]">
                  <span>{t("delivery")}</span>
                  <span>{t("deliveryRate")}</span>
                </div>
              </div>
              <div className="border-t border-[#E8E4DE] pt-4 mb-6">
                <div className="flex justify-between font-semibold text-[#1A1A1A]">
                  <span>{t("total")}</span>
                  <span>{formatPrice(cartTotal, locale)}</span>
                </div>
              </div>
              <Link
                href="/checkout"
                className="block w-full bg-[#1A1A1A] text-white text-center text-sm font-medium py-3 rounded hover:bg-[#C4A882] transition-colors uppercase tracking-wider"
              >
                {t("placeOrder")}
              </Link>
              <Link
                href="/shop"
                className="block w-full text-center text-sm text-[#6B6B6B] hover:text-[#1A1A1A] mt-3 transition-colors"
              >
                {t("continueShopping")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
