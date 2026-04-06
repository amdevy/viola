"use client";

import { useState, useEffect } from "react";
import { useProducts } from "@/hooks/useProducts";
import ProductGrid from "@/components/shop/ProductGrid";
import ProductFilter from "@/components/shop/ProductFilter";
import { useSearchParams } from "next/navigation";

export default function ShopContent() {
  const searchParams = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    category: searchParams.get("category") ?? "",
    minPrice: "",
    maxPrice: "",
    hairType: "",
    sort: "newest",
  });

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      category: searchParams.get("category") ?? "",
    }));
  }, [searchParams]);

  const { products, loading } = useProducts({
    category: filters.category || undefined,
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    hairType: filters.hairType || undefined,
    sort: filters.sort,
  });

  return (
    <>
      {/* Breadcrumb */}
      <nav className="text-xs text-[#6B6B6B] mb-6">
        <span>Головна</span>
        <span className="mx-2">/</span>
        <span className="text-[#1A1A1A]">Магазин</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#6B6B6B]">
            {loading ? "..." : `${products.length} товарів`}
          </span>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="md:hidden flex items-center gap-1.5 text-sm border border-[#E8E4DE] px-3 py-2 rounded hover:border-[#C4A882] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Фільтри
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
          <ProductGrid products={products} loading={loading} />
        </div>
      </div>
    </>
  );
}
