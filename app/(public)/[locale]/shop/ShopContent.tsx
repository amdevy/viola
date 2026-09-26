"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useProducts } from "@/hooks/useProducts";
import ProductGrid from "@/components/shop/ProductGrid";
import ProductFilter from "@/components/shop/ProductFilter";
import { useSearchParams } from "next/navigation";
import type { Product } from "@/types";

export default function ShopContent({
  initialProducts,
}: {
  /** The unfiltered catalogue from the server; `null` if it failed to load. */
  initialProducts: Product[] | null;
}) {
  const t = useTranslations("shop");
  const tc = useTranslations("common");
  const tf = useTranslations("filter");
  const [showFilter, setShowFilter] = useState(false);
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

  const applyCategoryParam = useCallback((category: string) => {
    setFilters((prev) => (prev.category === category ? prev : { ...prev, category }));
    setCategoryParamRead(true);
  }, []);

  const { products, loading } = useProducts(
    {
      category: filters.category || undefined,
      minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
      hairType: filters.hairType || undefined,
      sort: filters.sort,
    },
    initialProducts,
  );

  return (
    <>
      <Suspense fallback={null}>
        <CategoryParam onChange={applyCategoryParam} />
      </Suspense>

      {/* Breadcrumb */}
      <nav className="text-xs text-[#6B6B6B] mb-6">
        <Link href="/" className="hover:text-[#C4A882]">{tc("home")}</Link>
        <span className="mx-2">/</span>
        <span className="text-[#1A1A1A]">{t("breadcrumbShop")}</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#6B6B6B]">
            {loading ? "..." : tc("products", { count: products.length })}
          </span>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="md:hidden flex items-center gap-1.5 text-sm border border-[#E8E4DE] px-3 py-2 rounded hover:border-[#C4A882] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {tf("filters")}
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar filters (desktop) */}
        <aside className={`${showFilter ? "block" : "hidden"} md:block w-full md:w-56 flex-shrink-0`}>
          <ProductFilter filters={filters} onChange={setFilters} />
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          <ProductGrid
            products={products}
            loading={loading}
            listName="shop"
            trackView={categoryParamRead}
          />
        </div>
      </div>
    </>
  );
}

/**
 * Applies ?category= to the filters. It sits in a Suspense boundary of its own
 * because useSearchParams() opts everything up to the nearest boundary out of
 * the prerendered HTML: while ShopContent called it directly, /shop shipped
 * without a single product link even when the list itself was ready.
 */
function CategoryParam({ onChange }: { onChange: (category: string) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    onChange(searchParams.get("category") ?? "");
  }, [searchParams, onChange]);

  return null;
}
