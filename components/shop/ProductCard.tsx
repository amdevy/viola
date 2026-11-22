"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useCart } from "@/hooks/useCart";
import { useCartQuantity } from "@/hooks/useCartQuantity";
import { formatPrice, formatVolume } from "@/lib/utils";
import { showAddedToCart } from "@/components/shop/addedToCartToast";
import { sendGAEvent } from "@/lib/analytics";
import StockNotifyModal from "@/components/shop/StockNotifyModal";
import ProductLikeButton from "@/components/shop/ProductLikeButton";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations("productCard");
  const tc = useTranslations("common");
  const tcart = useTranslations("cart");
  const locale = useLocale();
  const [hovered, setHovered] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const { addItem, updateQuantity } = useCart();
  const quantity = useCartQuantity(product.id);

  const primaryImage = product.images?.[0]?.trim() || "/placeholder-product.png";
  const secondaryImage = product.images?.[1]?.trim() || primaryImage;

  const canBuy = product.in_stock && !product.is_coming_soon;
  const inCart = canBuy && quantity > 0;
  const productHref = `/shop/${product.slug}`;

  // The actions sit above the stretched link, but a tap must still never
  // bubble into it or let the browser follow it.
  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const gaOneUnit = (event: "add_to_cart" | "remove_from_cart") => {
    sendGAEvent("event", event, {
      currency: "UAH",
      value: product.price,
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity: 1,
      }],
    });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    stop(e);
    if (!canBuy) {
      setNotifyOpen(true);
      return;
    }
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: primaryImage,
      quantity: 1,
      volume: product.volume ?? undefined,
    });
    gaOneUnit("add_to_cart");
    // The shopper stays in the list; the cart is one tap away in the toast on
    // wider screens and in the bottom bar on phones. See addedToCartToast.tsx.
    showAddedToCart({
      title: tcart("added"),
      detail: product.name,
      openLabel: tcart("openShort"),
    });
  };

  // The counter itself shows the change, so +/− stay quiet (no toast).
  // Going below one removes the product and the card returns to "add".
  const handleStep = (e: React.MouseEvent, delta: 1 | -1) => {
    stop(e);
    updateQuantity(product.id, quantity + delta);
    gaOneUnit(delta > 0 ? "add_to_cart" : "remove_from_cart");
  };

  const handleSelect = () => {
    sendGAEvent("event", "select_item", {
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_category: product.category?.name ?? undefined,
        price: product.price,
      }],
    });
  };

  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : null;

  // Раніше картка була <div onClick={router.push}>: у серверному HTML не було
  // жодного <a href> на товар, і Google знаходив товари лише через sitemap —
  // більшість так і лишалась "Discovered – not indexed". Тепер посилання одне,
  // справжнє, на назві товару; ::after розтягує його на всю картку, а кнопки
  // стоять вище за z-index, тож клік по них не веде на сторінку товару.
  // Рамка фокуса теж на ::after: у h3 стоїть line-clamp (overflow: hidden),
  // який обрізав би рамку навколо самого тексту.
  return (
    <div
      className="group relative flex flex-col"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image container */}
      <div className="relative aspect-[3/4] overflow-hidden rounded bg-[#F0EDE8] mb-3">
        <Image
          src={hovered ? secondaryImage : primaryImage}
          alt={
            locale === "en"
              ? `Na Gólov[y] ${product.name} — buy in Ukraine`
              : `Na Gólov[y] (На Голову) ${product.name} — купити в Україні`
          }
          fill
          className="object-cover transition-all duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          onError={(e) => {
            e.currentTarget.src = "/placeholder-product.png";
          }}
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_bestseller && !product.is_coming_soon && (
            <span className="bg-[#1A1A1A] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              {tc("bestsellerBadge")}
            </span>
          )}
          {product.is_new && (
            <span className="bg-[#38A169] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              {tc("newBadge")}
            </span>
          )}
          {product.is_coming_soon && (
            <span className="bg-[#D97706] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              {tc("comingSoonBadge")}
            </span>
          )}
          {discount && (
            <span className="bg-[#C4A882] text-white text-[10px] font-bold px-2 py-0.5 rounded">
              -{discount}%
            </span>
          )}
          {!product.in_stock && (
            <span className="bg-[#1A1A1A] text-white text-[10px] font-bold px-2 py-0.5 rounded">
              {t("outOfStock")}
            </span>
          )}
        </div>

        {/* Like button */}
        <ProductLikeButton
          productId={product.id}
          initialCount={product.likes_count ?? 0}
          size="sm"
          variant="card"
        />

        {/* Quick buttons: a strip over the bottom edge of the photo, dark "add"
            and gold "consultation". z-10 lifts it over the name link's ::after,
            which covers the whole card. 44px high on phones (a thumb target),
            40px from sm up, the same in both states so nothing jumps.
            From sm up it slides in on hover or keyboard focus — but only where
            the device can hover, so touch screens of any width always show it —
            and stays while the product is in the cart.
            Inside, the layout follows the width of the card, not of the screen
            (cards sit in grids of 2, 3 and 4 columns): this wrapper is a size
            container and everything below 15rem of strip is the "narrow" layout.
            The container sits here and not on the card or the image box: its
            layout containment makes a stacking context, which on the image box
            would drop the strip and the like button under the name link's
            ::after, and on the card would capture the fixed StockNotifyModal. */}
        <div
          data-quick-strip
          className={`@container absolute inset-x-0 bottom-0 z-10 h-11 sm:h-10 transition-transform duration-300 ${
            inCart
              ? ""
              : "sm:[@media(hover:hover)]:translate-y-full sm:group-hover:translate-y-0 sm:group-focus-within:translate-y-0"
          }`}
        >
          <div className="flex h-full">
            {inCart ? (
              // Counter styled to the strip: white − and + on the dark half, a
              // gold tick and the number between them. No min-w-0: in the wide
              // layout it keeps the width its content needs and the gold half
              // gives way, so the buttons never spill over consultation.
              <div className="flex grow basis-1/2 items-center justify-between bg-[#1A1A1A] text-white">
                <button
                  type="button"
                  onClick={(e) => handleStep(e, -1)}
                  aria-label={tcart("decrease")}
                  className="flex h-full w-12 flex-shrink-0 items-center justify-center transition-colors hover:bg-[#333333] @min-[15rem]:w-10"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" d="M5 12h14" />
                  </svg>
                </button>
                <span className="flex min-w-0 items-center justify-center gap-1 text-sm font-semibold" aria-live="polite">
                  <svg className="h-3.5 w-3.5 flex-shrink-0 text-[#C4A882]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span aria-hidden="true">{quantity}</span>
                  <span className="sr-only">{t("inCartCount", { count: quantity })}</span>
                </span>
                <button
                  type="button"
                  onClick={(e) => handleStep(e, 1)}
                  aria-label={tcart("increase")}
                  className="flex h-full w-12 flex-shrink-0 items-center justify-center transition-colors hover:bg-[#333333] @min-[15rem]:w-10"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>
            ) : (
              // A 50% basis on both halves (and on the counter) keeps the
              // border in the middle whatever the padding, while a flex item
              // never shrinks below its longest word: on a narrow card
              // «КОНСУЛЬТАЦІЯ» takes the room it needs and the dark half the
              // rest, instead of either label being cut. Below 12rem of strip
              // (every phone card, the 4-column grid at 768) the split is
              // 45/55, so the longer gold word gets some air around it too.
              // Below 9.5rem of strip (a 320px phone) both labels drop to 9px
              // with tight tracking so «СПОВІСТИТИ» and «КОНСУЛЬТАЦІЯ» still
              // fit side by side.
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex grow basis-1/2 @max-[12rem]:basis-[45%] items-center justify-center bg-[#1A1A1A] px-0.5 text-center text-[10px] font-medium uppercase leading-tight tracking-normal text-white transition-colors hover:bg-[#C4A882] @max-[9.5rem]:text-[9px] @max-[9.5rem]:tracking-tight @min-[15rem]:px-1 @min-[15rem]:text-xs @min-[15rem]:tracking-wider"
              >
                {canBuy ? t("addToCart") : tc("notifyMe")}
              </button>
            )}
            {/* In the cart, a narrow card hides its consultation: half of it
                (~80px) cannot hold two 48px buttons and a number, the owner
                asked for consultation to step aside once the product is added,
                and «Запитати» in the phone bottom bar stays one tap away. */}
            <a
              href="https://t.me/violagegedosh"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                sendGAEvent("event", "telegram_consultation", {
                  source: "product_card",
                  product_id: product.id,
                  product_name: product.name,
                });
              }}
              className={`${
                inCart ? "hidden @min-[15rem]:flex" : "flex"
              } grow basis-1/2 @max-[12rem]:basis-[55%] items-center justify-center bg-[#C4A882] px-0.5 text-center text-[10px] font-medium uppercase leading-tight tracking-normal text-white transition-colors hover:bg-[#b89970] @max-[9.5rem]:text-[9px] @max-[9.5rem]:tracking-tight @min-[15rem]:px-1 @min-[15rem]:text-xs @min-[15rem]:tracking-wider`}
            >
              {tc("consultation")}
            </a>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 flex-1">
        <h3 className="text-sm font-medium text-[#1A1A1A] line-clamp-2 group-hover:text-[#C4A882] transition-colors">
          <Link
            href={productHref}
            onClick={handleSelect}
            className="after:absolute after:inset-0 after:rounded after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-[#C4A882]"
          >
            {product.name}
          </Link>
        </h3>
        {product.volume && (
          <p className="text-xs text-[#6B6B6B]">{formatVolume(product.volume, locale)}</p>
        )}
        <div className="flex items-center gap-2 mt-auto pt-1">
          <span className="text-sm font-semibold text-[#1A1A1A]">
            {formatPrice(product.price, locale)}
          </span>
          {product.compare_price && (
            <span className="text-xs text-[#A0A0A0] line-through">
              {formatPrice(product.compare_price, locale)}
            </span>
          )}
        </div>
      </div>

      <StockNotifyModal
        isOpen={notifyOpen}
        onClose={() => setNotifyOpen(false)}
        product={product}
      />
    </div>
  );
}
