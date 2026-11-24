"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { useCart } from "@/hooks/useCart";
import { useHasMounted } from "@/hooks/useCartQuantity";
import { formatPrice } from "@/lib/utils";
import { sendGAEvent } from "@/lib/analytics";
import { SITE } from "@/lib/site";
import { showsBottomNav } from "@/lib/mobile-nav";

interface Props {
  onSearch: () => void;
  onMenu: () => void;
}

const ITEM =
  "flex h-14 w-full flex-col items-center justify-center gap-1 whitespace-nowrap text-[10px] font-medium tracking-wide transition-colors active:bg-panel";

/**
 * The phone's five main controls, at the bottom edge where a thumb rests:
 * ask, search, cart (in the centre), catalogue and menu. On a tall phone held
 * in one hand the header's corner is out of reach, so where this bar is shown
 * the header gives up its own cart and menu icons (see Header and
 * lib/mobile-nav.ts).
 *
 * "Ask" opens a chat with the technologist on Telegram: most orders close after
 * such a conversation, so it is one tap away on every page.
 *
 * Height is 3.5rem plus the home-indicator inset; the footer and the product
 * page's sticky buy bar (MobileStickyBar) leave room for exactly that.
 */
export default function MobileBottomNav({ onSearch, onMenu }: Props) {
  const t = useTranslations("bottomNav");
  const locale = useLocale();
  const pathname = usePathname();
  const openCart = useCart((s) => s.openCart);
  const count = useCart((s) => s.itemCount());
  const sum = useCart((s) => s.total());
  const mounted = useHasMounted();

  if (!showsBottomNav(pathname)) return null;

  const inShop = pathname.startsWith("/shop");
  const cartCount = mounted ? count : 0;
  // The tab shows the running total instead of the word "Cart": the shopper
  // sees what the cart adds up to without a third bar above the navigation.
  // The server HTML always says "Cart" (cartCount is 0 until hydration).
  const cartSum = cartCount > 0 ? formatPrice(sum, locale) : null;

  // Which of the five items get used. content_type / content_id are GA4's own
  // dimensions, so the report works without registering anything.
  const track = (item: "catalog" | "search" | "cart" | "ask" | "menu") =>
    sendGAEvent("event", "mobile_nav_click", { content_type: "bottom_nav", content_id: item });

  return (
    <nav
      aria-label={t("label")}
      className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.04)]"
    >
      <ul className="grid grid-cols-5">
        <li>
          <a
            href={SITE.telegram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("askAria")}
            onClick={() => {
              track("ask");
              sendGAEvent("event", "telegram_consultation", { source: "bottom_nav" });
            }}
            className={`${ITEM} text-foreground`}
          >
            <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            {t("ask")}
          </a>
        </li>
        <li>
          <button
            type="button"
            onClick={() => {
              onSearch();
              track("search");
            }}
            className={`${ITEM} text-foreground`}>
            <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            {t("search")}
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => {
              openCart("bottom_nav");
              track("cart");
            }}
            aria-label={cartSum ? t("cartWithSum", { count: cartCount, sum: cartSum }) : t("cart")}
            className={`${ITEM} text-foreground`}
          >
            <span className="relative">
              <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              {cartCount > 0 && (
                // Keyed by the count: a new number remounts the badge, which
                // replays the bump — the sign that "add to cart" worked.
                <span
                  key={cartCount}
                  className="motion-safe:animate-cart-bump absolute -right-2.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-white"
                >
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </span>
            <span aria-hidden="true" className="max-w-full truncate px-0.5">
              {cartSum ?? t("cart")}
            </span>
          </button>
        </li>
        <li>
          <Link
            href="/shop"
            onClick={() => track("catalog")}
            aria-current={inShop ? "page" : undefined}
            className={`${ITEM} ${inShop ? "text-accent" : "text-foreground"}`}
          >
            <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            {t("catalog")}
          </Link>
        </li>
        <li>
          <button
            type="button"
            onClick={() => {
              onMenu();
              track("menu");
            }}
            className={`${ITEM} text-foreground`}>
            <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            {t("menu")}
          </button>
        </li>
      </ul>
    </nav>
  );
}
