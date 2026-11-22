"use client";

import { Suspense, useState, useEffect, useCallback, useMemo, useId, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useProducts } from "@/hooks/useProducts";
import ProductGrid from "@/components/shop/ProductGrid";
import ProductFilter from "@/components/shop/ProductFilter";
import { useSearchParams } from "next/navigation";
import { matchesSearch } from "@/lib/search";
import { sendGAEvent } from "@/lib/analytics";
import type { Product } from "@/types";

export default function ShopContent({
  initialProducts,
  categoryLinks,
}: {
  /** The unfiltered catalogue from the server; `null` if it failed to load. */
  initialProducts: Product[] | null;
  /** Server-rendered links to the category pages, shown above the grid. */
  categoryLinks?: React.ReactNode;
}) {
  const t = useTranslations("shop");
  const tc = useTranslations("common");
  const tf = useTranslations("filter");
  const ts = useTranslations("search");
  const [showFilter, setShowFilter] = useState(false);
  const filterPanelId = useId();
  const listTopRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
    hairType: "",
    sort: "popular",
  });
  // ?category= is only known after hydration (see CategoryParam). Until then
  // the grid shows the unfiltered list but doesn't report it as viewed, so a
  // visit to /shop?category=… sends one view_item_list — for the filtered list.
  const [categoryParamRead, setCategoryParamRead] = useState(false);
  // ?search= — where the site search sends "show all results", and the address
  // the layout's SearchAction (JSON-LD) has always advertised.
  const [search, setSearch] = useState("");

  const applyCategoryParam = useCallback((category: string, searchTerm: string) => {
    setFilters((prev) => (prev.category === category ? prev : { ...prev, category }));
    setSearch(searchTerm);
    setCategoryParamRead(true);
  }, []);

  const { products: listed, loading } = useProducts(
    {
      category: filters.category || undefined,
      minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
      hairType: filters.hairType || undefined,
      sort: filters.sort,
    },
    initialProducts,
  );

  // Hair types offered by the filter come from the UNFILTERED catalogue, never
  // from the list on screen: otherwise options would vanish as the shopper
  // narrows the list. Normally that is the server's list. When the server
  // could not load it, the first unfiltered list the client loads stands in
  // (sort only reorders, so any sort will do) and is kept from then on.
  const [clientHairTypes, setClientHairTypes] = useState<string[] | null>(null);
  const unfiltered = !filters.category && !filters.minPrice && !filters.maxPrice && !filters.hairType;
  if (initialProducts === null && clientHairTypes === null && unfiltered && !loading && listed.length > 0) {
    setClientHairTypes(collectHairTypes(listed));
  }
  const availableHairTypes = useMemo(
    () => (initialProducts ? collectHairTypes(initialProducts) : (clientHairTypes ?? [])),
    [initialProducts, clientHairTypes],
  );

  // Matched here, with the same rules as the search overlay (lib/search.ts),
  // rather than by the database: the two then agree on every query, and the
  // filters and sorting above keep working on the result.
  const products = useMemo(
    () =>
      search
        ? listed.filter((p) =>
            matchesSearch([p.name, p.name_en, p.category?.name, p.volume], search),
          )
        : listed,
    [listed, search],
  );

  // Sort is not a filter: it reorders the list but never makes it shorter.
  const activeFilters = [filters.category, filters.minPrice, filters.maxPrice, filters.hairType]
    .filter(Boolean).length;

  // On phones the open panel is far taller than the screen and the products
  // sit below it, so the results bar closes it and brings the list back up.
  const showResults = () => {
    // The tap is counted even while the list is still loading; then there is
    // no number on the button, so results_count is left out rather than guessed.
    sendGAEvent("event", "filter_show_results", loading ? {} : { results_count: products.length });
    setShowFilter(false);
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    listTopRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  };

  return (
    <>
      <Suspense fallback={null}>
        <CategoryParam onChange={applyCategoryParam} />
      </Suspense>

      {/* Breadcrumb */}
      <nav className="text-xs text-[#6B6B6B] mb-4 md:mb-6">
        <Link href="/" className="hover:text-[#C4A882]">{tc("home")}</Link>
        <span className="mx-2">/</span>
        <span className="text-[#1A1A1A]">{t("breadcrumbShop")}</span>
      </nav>

      {categoryLinks}

      {search && (
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-sm font-medium text-[#1A1A1A]">
            {ts("resultsFor", { query: search })}
          </p>
          <Link
            href="/shop"
            className="text-sm text-[#C4A882] underline underline-offset-2 hover:text-[#A8875E]"
          >
            {ts("reset")}
          </Link>
        </div>
      )}

      {/* scroll-mt clears the sticky header (65px) when the results bar
          scrolls the list back into view. */}
      <div ref={listTopRef} className="flex items-center justify-between mb-4 md:mb-6 scroll-mt-20">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#6B6B6B]">
            {loading ? "..." : tc("products", { count: products.length })}
          </span>
          <button
            type="button"
            onClick={() => {
              // Only opening is counted: it is what shows the panel gets used.
              if (!showFilter) sendGAEvent("event", "filter_panel_open", {});
              setShowFilter(!showFilter);
            }}
            aria-expanded={showFilter}
            aria-controls={filterPanelId}
            // With the panel closed, the count says why the list may be short.
            aria-label={!showFilter && activeFilters > 0 ? tf("filtersActive", { count: activeFilters }) : undefined}
            className={`md:hidden flex items-center gap-1.5 text-sm border px-3 py-2 rounded hover:border-[#C4A882] transition-colors ${
              showFilter ? "border-[#C4A882] bg-[#FDF9F5]" : "border-[#E8E4DE]"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {tf("filters")}
            {!showFilter && activeFilters > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C4A882] px-1 text-xs font-semibold text-[#1A1A1A]">
                {activeFilters}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Phones: the panel stacks above the grid, so the grid keeps its full
          width. From md up: sidebar on the left, grid on the right. */}
      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        <aside
          id={filterPanelId}
          className={`${showFilter ? "block" : "hidden"} md:block w-full md:w-56 flex-shrink-0`}
        >
          <ProductFilter filters={filters} onChange={setFilters} availableHairTypes={availableHairTypes} />
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {search && !loading && products.length === 0 ? (
            <p className="py-12 text-center text-sm text-[#6B6B6B]">{ts("nothingFound")}</p>
          ) : (
            <ProductGrid
              products={products}
              loading={loading}
              listName={search ? "search" : "shop"}
              trackView={categoryParamRead}
            />
          )}
        </div>
      </div>

      {/* Same place and layer as the product page's MobileStickyBar: just
          above the bottom navigation and under it in stacking order. */}
      {showFilter && (
        <div className="md:hidden fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 bg-white border-t border-[#E8E4DE] shadow-[0_-4px_12px_rgba(0,0,0,0.06)] px-4 py-3">
          <button
            type="button"
            onClick={showResults}
            className="h-12 w-full rounded bg-[#1A1A1A] text-white text-sm font-semibold"
          >
            {loading ? tf("showProducts") : tf("showResults", { count: products.length })}
          </button>
        </div>
      )}
    </>
  );
}

function collectHairTypes(products: Product[]): string[] {
  return [...new Set(products.flatMap((p) => p.hair_type ?? []))];
}

/**
 * Applies ?category= and ?search= to the list. It sits in a Suspense boundary of its own
 * because useSearchParams() opts everything up to the nearest boundary out of
 * the prerendered HTML: while ShopContent called it directly, /shop shipped
 * without a single product link even when the list itself was ready.
 */
function CategoryParam({
  onChange,
}: {
  onChange: (category: string, search: string) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    onChange(
      searchParams.get("category") ?? "",
      (searchParams.get("search") ?? "").trim().slice(0, 100),
    );
  }, [searchParams, onChange]);

  return null;
}
