"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useCart } from "@/hooks/useCart";
import { formatPrice, formatVolume } from "@/lib/utils";
import { sendGAEvent } from "@/lib/analytics";
import { SITE } from "@/lib/site";
import {
  buildSearchIndex,
  searchProducts,
  searchTokens,
  MIN_SEARCH_LENGTH,
  type SearchEntry,
  type SearchProduct,
} from "@/lib/search";
import type { CategoryNode } from "@/lib/categories";
import {
  clearSearchMarker,
  markSearchEntry,
  readStoredQuery,
  storeQuery,
  type SearchMarker,
} from "@/lib/search-session";

/** How many matches the overlay lists; the rest are one tap away in the catalogue. */
const MAX_RESULTS = 12;
const POPULAR_COUNT = 4;

// One request per visit, shared by every opening of the search. A failed
// request is forgotten so the next opening tries again.
let indexRequest: Promise<SearchEntry[]> | null = null;

function loadSearchIndex(): Promise<SearchEntry[]> {
  indexRequest ??= fetch("/api/products/search-index")
    .then((res) => {
      if (!res.ok) throw new Error(`search index: ${res.status}`);
      return res.json() as Promise<{ products?: SearchProduct[] }>;
    })
    .then((data) => buildSearchIndex(data.products ?? []))
    .catch((err) => {
      indexRequest = null;
      throw err;
    });
  return indexRequest;
}

interface Props {
  onClose: () => void;
  categories: CategoryNode[];
  /** Owned by the opener, which focuses the field inside the tap that opens the search. */
  inputRef: RefObject<HTMLInputElement | null>;
  /**
   * Set when Back brought the shopper here from a result: the list goes back
   * to where it was. (The opener does not focus the field then — on Android
   * that would raise the keyboard over the results.)
   */
  restored?: SearchMarker | null;
}

/**
 * Product search.
 *
 * On every screen the field is on top and the results read downward from it,
 * best match first — the pattern shoppers know from the big Ukrainian stores.
 * On a phone the keyboard takes the bottom half anyway, so the results belong
 * right under the field, in the part of the screen it leaves free. Phones get
 * a full-screen page with a back arrow; from md up it is a dialog over the
 * dimmed page.
 *
 * Rendered only while open (see Header). The query outlives it in
 * sessionStorage, so reopening shows the last search. Leaving for a result
 * marks the history entry, so Back returns to the search with the same query
 * and list (lib/search-session.ts, Header); closing it by hand removes the mark.
 */
export default function SearchOverlay({ onClose, categories, inputRef, restored = null }: Props) {
  const t = useTranslations("search");
  const tc = useTranslations("common");
  const tp = useTranslations("productCard");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { addItem, openCart } = useCart();
  const cartItems = useCart((s) => s.items);

  // Mounted only on the client, after a tap or a Back, so storage can be read
  // here without touching the server HTML.
  const [query, setQuery] = useState(readStoredQuery);
  // Only typing reports a search to GA; a query brought back from storage was
  // reported when it was typed.
  const typed = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    let ignore = false;
    loadSearchIndex()
      .then((entries) => {
        if (ignore) return;
        setIndex(entries);
        setFailed(false);
      })
      .catch(() => {
        if (!ignore) setFailed(true);
      });
    return () => {
      ignore = true;
    };
  }, [attempt]);

  // The shopper closed the search: Back/Forward must not bring it back.
  const dismissRef = useRef(() => {});
  const dismiss = () => {
    clearSearchMarker();
    onClose();
  };
  useEffect(() => {
    dismissRef.current = () => {
      clearSearchMarker();
      onCloseRef.current();
    };
  });

  // Back from a result: put the list back where the shopper left it, once the
  // (cached) index has rendered the results.
  const scrollRestored = useRef(false);
  useEffect(() => {
    if (!restored || !index || scrollRestored.current || !listRef.current) return;
    scrollRestored.current = true;
    listRef.current.scrollTop = restored.scrollTop;
  }, [restored, index]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Lets app/globals.css hide the page behind the search on phones: iOS 26
    // paints the document under its floating toolbar and translucent keyboard,
    // where no position:fixed layer reaches.
    const root = document.documentElement;
    root.setAttribute("data-search-open", "");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      root.removeAttribute("data-search-open");
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // On phones the panel is sized to the part of the screen the keyboard leaves
  // free. iOS draws the keyboard over the page without resizing it, so a plain
  // full-height panel would run its list on under the keyboard; the visual
  // viewport is the one measure that follows it, and the list ends above it.
  useEffect(() => {
    const viewport = window.visualViewport;
    const panel = panelRef.current;
    if (!viewport || !panel) return;
    const phone = window.matchMedia("(max-width: 767px)");
    const sync = () => {
      panel.style.height = phone.matches ? `${viewport.height}px` : "";
      panel.style.top = phone.matches ? `${viewport.offsetTop}px` : "";
    };
    sync();
    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);
    return () => {
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
    };
  }, []);

  const term = query.trim();
  const longEnough = searchTokens(term).join("").length >= MIN_SEARCH_LENGTH;
  const matches = useMemo(
    () => (index && longEnough ? searchProducts(index, term) : []),
    [index, longEnough, term],
  );
  const results = matches.slice(0, MAX_RESULTS);

  const popular = useMemo(() => {
    if (!index) return [];
    const buyable = index
      .map((entry) => entry.product)
      .filter((p) => p.in_stock && !p.is_coming_soon);
    const hits = buyable.filter((p) => p.is_bestseller);
    return (hits.length > 0 ? hits : buyable).slice(0, POPULAR_COUNT);
  }, [index]);

  // What people look for and whether the shop had it: `search` for every
  // search, `search_no_results` for the ones that found nothing. Sent once
  // typing pauses (or at once on Enter), once per term per opening, and only
  // for typed queries — a query brought back from storage or by Back was
  // reported when it was typed.
  const matchCount = matches.length;
  const searchTerm = term.toLowerCase().slice(0, 60);
  const reported = useRef(new Set<string>());
  const reportSearch = () => {
    if (!index || !longEnough || !typed.current || reported.current.has(searchTerm)) return;
    reported.current.add(searchTerm);
    sendGAEvent("event", "search", { search_term: searchTerm, results_count: matchCount });
    if (matchCount === 0) sendGAEvent("event", "search_no_results", { search_term: searchTerm });
  };
  const reportSearchRef = useRef(reportSearch);
  useEffect(() => {
    reportSearchRef.current = reportSearch;
  });
  useEffect(() => {
    if (!index || !longEnough || !typed.current) return;
    const timer = setTimeout(() => reportSearchRef.current(), 1200);
    return () => clearTimeout(timer);
  }, [index, longEnough, term, matchCount]);

  // Back brought the shopper back into the search: shows whether the return
  // path is used. The term is the one the search reopened with.
  const returnReported = useRef(false);
  useEffect(() => {
    if (!restored || returnReported.current) return;
    returnReported.current = true;
    const restoredTerm = readStoredQuery().trim().toLowerCase().slice(0, 60);
    sendGAEvent("event", "search_return", restoredTerm ? { search_term: restoredTerm } : {});
  }, [restored]);

  const inCart = useMemo(() => new Set(cartItems.map((i) => i.productId)), [cartItems]);
  const displayName = (p: SearchProduct) => (locale === "en" && p.name_en ? p.name_en : p.name);

  /** "search" for matches of a query, "search_popular" for the rows shown before typing. */
  type ListId = "search" | "search_popular";

  const add = (p: SearchProduct, list: ListId) => {
    addItem({
      productId: p.id,
      name: displayName(p),
      price: p.price,
      image: p.image ?? "",
      quantity: 1,
      volume: p.volume ?? undefined,
    });
    sendGAEvent("event", "add_to_cart", {
      currency: "UAH",
      value: p.price,
      item_list_id: list,
      item_list_name: "search",
      items: [{ item_id: p.id, item_name: displayName(p), price: p.price, quantity: 1 }],
    });
  };

  // Leaving for a result: mark this history entry, so Back comes back to the
  // search with this query and list. A result that is the page already open
  // is no navigation at all — then the search just closes.
  const leave = (samePage: boolean) => {
    if (samePage) {
      dismiss();
      return;
    }
    markSearchEntry({ scrollTop: listRef.current?.scrollTop ?? 0 });
    onClose();
  };

  // index is zero-based, as in GA4's own examples and the shop's view_item_list.
  const select = (p: SearchProduct, position: number, list: ListId) => {
    sendGAEvent("event", "select_item", {
      item_list_id: list,
      item_list_name: list,
      ...(list === "search" ? { search_term: searchTerm } : {}),
      items: [{ item_id: p.id, item_name: displayName(p), price: p.price, index: position }],
    });
    leave(pathname === `/shop/${p.slug}`);
  };

  const showCart = () => {
    dismiss();
    openCart("search");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!longEnough) return;
    reportSearch();
    const samePage =
      pathname === "/shop" && new URLSearchParams(window.location.search).get("search") === term;
    leave(samePage);
    if (!samePage) router.push({ pathname: "/shop", query: { search: term } });
  };

  const changeQuery = (value: string) => {
    typed.current = true;
    setQuery(value);
    storeQuery(value);
  };

  const row = (p: SearchProduct, position: number, list: ListId) => {
    const name = displayName(p);
    const buyable = p.in_stock && !p.is_coming_soon;
    const added = inCart.has(p.id);
    return (
      <li
        key={p.id}
        className="flex items-center gap-3 rounded border border-[#E8E4DE] bg-white p-2"
      >
        <Link
          href={`/shop/${p.slug}`}
          onClick={() => select(p, position, list)}
          className="group flex min-w-0 flex-1 items-center gap-3"
        >
          <div className="relative h-14 w-12 flex-shrink-0 overflow-hidden rounded bg-[#F0EDE8]">
            <Image
              src={p.image ?? "/placeholder-product.png"}
              alt=""
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm leading-snug text-[#1A1A1A] transition-colors group-hover:text-[#C4A882]">
              {name}
            </p>
            <p className="mt-0.5 text-xs text-[#6B6B6B]">
              <span className="font-semibold text-[#1A1A1A]">{formatPrice(p.price, locale)}</span>
              {p.volume && <> · {formatVolume(p.volume, locale)}</>}
              {/* In words too, so the tick on the button is not the only sign. */}
              {buyable && added && (
                <> · <span className="font-medium text-[#7A5C36]">{tp("inCart")}</span></>
              )}
              {!buyable && (
                <> · {p.is_coming_soon ? tc("comingSoonBadge") : tp("outOfStock")}</>
              )}
            </p>
          </div>
        </Link>
        {buyable && (
          <button
            type="button"
            onClick={() => (added ? showCart() : add(p, list))}
            aria-label={added ? tp("inCartOpen") : `${tp("addToCartFull")}: ${name}`}
            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
              added
                ? "border border-[#C4A882] bg-[#FDF9F5] text-[#C4A882]"
                : "bg-[#1A1A1A] text-white hover:bg-[#C4A882]"
            }`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              {added ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              )}
            </svg>
          </button>
        )}
      </li>
    );
  };

  const heading = "mb-2 text-[10px] uppercase tracking-widest text-[#6B6B6B]";

  let body: React.ReactNode;
  if (failed) {
    body = (
      <div className="rounded border border-[#E8E4DE] bg-white p-4 text-center">
        <p className="text-sm text-[#6B6B6B]">{t("loadError")}</p>
        <button
          type="button"
          onClick={() => {
            setFailed(false);
            setAttempt((n) => n + 1);
          }}
          className="mt-3 rounded bg-[#1A1A1A] px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-white"
        >
          {t("retry")}
        </button>
      </div>
    );
  } else if (!index) {
    body = (
      <div className="flex flex-col gap-2" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[74px] animate-pulse rounded bg-[#F0EDE8]" />
        ))}
      </div>
    );
  } else if (longEnough && results.length === 0) {
    body = (
      <div className="rounded border border-[#E8E4DE] bg-white p-4 text-center">
        <p className="text-sm font-medium text-[#1A1A1A]">{t("noResults", { query: term })}</p>
        <p className="mt-1 text-xs text-[#6B6B6B]">{t("noResultsHint")}</p>
        {/* Each button as wide as its label (flex-auto), so both fit one row
            on a phone; when they don't (320px) the second wraps under the
            first and both take the full width. Labels centred both ways. */}
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={SITE.telegram}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              sendGAEvent("event", "telegram_consultation", {
                source: "search_no_results",
                search_term: searchTerm,
              })
            }
            className="flex min-h-11 flex-auto items-center justify-center rounded bg-[#C4A882] px-2.5 py-2 text-center text-xs font-medium uppercase leading-tight tracking-wide text-white"
          >
            {t("askTelegram")}
          </a>
          <Link
            href="/shop"
            onClick={() => {
              sendGAEvent("event", "select_content", {
                content_type: "search_no_results",
                content_id: "all_products",
                search_term: searchTerm,
              });
              dismiss();
            }}
            className="flex min-h-11 flex-auto items-center justify-center rounded border border-[#1A1A1A] px-2.5 py-2 text-center text-xs font-medium uppercase leading-tight tracking-wide text-[#1A1A1A]"
          >
            {t("allProducts")}
          </Link>
        </div>
      </div>
    );
  } else if (longEnough) {
    body = (
      <>
        <ul className="flex flex-col gap-2" aria-label={t("results")}>
          {results.map((p, i) => row(p, i, "search"))}
        </ul>
        {matches.length > results.length && (
          <button
            type="submit"
            className="rounded border border-[#E8E4DE] bg-white py-3 text-center text-xs font-medium uppercase tracking-wider text-[#1A1A1A]"
          >
            {t("showAll", { count: matches.length })}
          </button>
        )}
      </>
    );
  } else {
    body = (
      <>
        {categories.length > 0 && (
          <div>
            <p className={heading}>{t("categories")}</p>
            {/* One swipeable row on phones, edge to edge, so "Популярне" stays
                in view above the keyboard; wrapping again from md up. */}
            <div className="-mx-3 flex gap-2 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop/category/${cat.slug}`}
                  onClick={dismiss}
                  className="shrink-0 whitespace-nowrap rounded-full border border-[#E8E4DE] bg-white px-4 py-2.5 text-sm text-[#1A1A1A] transition-colors hover:border-[#C4A882]"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        )}
        {popular.length > 0 && (
          <div>
            <p className={heading}>{t("popular")}</p>
            <ul className="flex flex-col gap-2">{popular.map((p, i) => row(p, i, "search_popular"))}</ul>
          </div>
        )}
      </>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
      data-search-overlay
      className="fixed inset-0 z-[60] bg-[#FAFAF8] md:flex md:items-start md:justify-center md:bg-black/50 md:px-4 md:pt-[12vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div
        ref={panelRef}
        className="fixed inset-x-0 top-0 flex h-dvh flex-col bg-[#FAFAF8] md:relative md:h-auto md:max-h-[70vh] md:w-full md:max-w-xl md:overflow-hidden md:rounded md:shadow-2xl"
      >
        {/* One form around everything, so the keyboard's "search" key and the
            "show all" button under the results both submit it. */}
        <form onSubmit={submit} role="search" className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center gap-1 border-b border-[#E8E4DE] bg-white px-2 pb-2.5 pt-[calc(0.625rem+env(safe-area-inset-top))] md:gap-2 md:px-3 md:pt-2.5">
            {/* Phones: a back arrow on the left, where a full-screen page has it. */}
            <button
              type="button"
              onClick={dismiss}
              aria-label={t("close")}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded text-[#1A1A1A] md:hidden"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
            <div className="relative min-w-0 flex-1">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#A0A0A0]"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              {/* text-base (16px): iOS zooms the whole page into any field
                  with a smaller font. */}
              <input
                ref={inputRef}
                type="search"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                value={query}
                onChange={(e) => changeQuery(e.target.value)}
                placeholder={t("placeholder")}
                aria-label={t("title")}
                className="h-12 w-full appearance-none rounded border border-[#E8E4DE] bg-[#FAFAF8] pl-10 pr-10 text-base text-[#1A1A1A] placeholder:text-[#A0A0A0] focus:border-[#C4A882] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    // Same term normalisation as `search`. Clearing does not
                    // reset the once-per-term rule: retyping the same word in
                    // this opening is the same search, already counted.
                    if (searchTerm) sendGAEvent("event", "search_clear", { search_term: searchTerm });
                    changeQuery("");
                    inputRef.current?.focus();
                  }}
                  aria-label={t("clear")}
                  className="absolute right-0 top-0 flex h-12 w-10 items-center justify-center text-[#6B6B6B]"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="hidden h-12 flex-shrink-0 rounded px-3 text-sm font-medium text-[#1A1A1A] transition-colors hover:text-[#C4A882] md:block"
            >
              {t("close")}
            </button>
          </div>

          {/* Dragging the list puts the keyboard away, which gives the results
              the whole screen. */}
          <div
            ref={listRef}
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-3 py-3"
            onTouchMove={() => inputRef.current?.blur()}
          >
            {body}
          </div>
        </form>
      </div>
    </div>
  );
}
