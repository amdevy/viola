"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { sendGAEvent } from "@next/third-parties/google";
import { useCategories } from "@/hooks/useProducts";
import { HAIR_TYPES } from "@/lib/utils";

interface FilterState {
  category: string;
  minPrice: string;
  maxPrice: string;
  hairType: string;
  sort: string;
}

interface ProductFilterProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export default function ProductFilter({ filters, onChange }: ProductFilterProps) {
  const t = useTranslations("filter");
  const tc = useTranslations("categories");
  const th = useTranslations("hairTypes");
  const { tree } = useCategories();

  // Debounced price inputs
  const [localMin, setLocalMin] = useState(filters.minPrice);
  const [localMax, setLocalMax] = useState(filters.maxPrice);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setLocalMin(filters.minPrice);
    setLocalMax(filters.maxPrice);
  }, [filters.minPrice, filters.maxPrice]);

  const updatePrice = (key: "minPrice" | "maxPrice", value: string) => {
    if (key === "minPrice") setLocalMin(value);
    else setLocalMax(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange({ ...filters, [key]: value });
      if (value) {
        sendGAEvent("event", "filter_products", {
          filter_type: key,
          filter_value: value,
        });
      }
    }, 400);
  };

  const update = (key: keyof FilterState, value: string) => {
    onChange({ ...filters, [key]: value });
    if (key === "sort") {
      sendGAEvent("event", "sort_products", {
        sort_order: value,
      });
    } else if (value) {
      sendGAEvent("event", "filter_products", {
        filter_type: key,
        filter_value: value,
      });
    }
  };

  const reset = () => {
    onChange({ category: "", minPrice: "", maxPrice: "", hairType: "", sort: "popular" });
    sendGAEvent("event", "filter_products_reset", {});
  };

  const hasActive =
    filters.category || filters.minPrice || filters.maxPrice || filters.hairType;

  return (
    <div className="space-y-6">
      {/* Sort */}
      <div>
        <label className="text-xs uppercase tracking-widest text-[#6B6B6B] block mb-2">
          {t("sorting")}
        </label>
        <select
          value={filters.sort}
          onChange={(e) => update("sort", e.target.value)}
          className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-sm text-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A882]"
        >
          <option value="popular">{t("popular")}</option>
          <option value="newest">{t("newest")}</option>
          <option value="price_asc">{t("priceAsc")}</option>
          <option value="price_desc">{t("priceDesc")}</option>
        </select>
      </div>

      {/* Categories */}
      {tree.length > 0 && (
        <div>
          <label className="text-xs uppercase tracking-widest text-[#6B6B6B] block mb-2">
            {t("category")}
          </label>
          <div className="space-y-1">
            <button
              onClick={() => update("category", "")}
              className={`w-full text-left text-sm px-2 py-1.5 rounded transition-colors ${
                !filters.category
                  ? "bg-[#1A1A1A] text-white"
                  : "text-[#1A1A1A] hover:bg-[#F0EDE8]"
              }`}
            >
              {tc("allCategories")}
            </button>
            {tree.map((cat) =>
              // A parent holds no products of its own, so offering it as a
              // filter would return an empty grid. It becomes a heading and its
              // children become the options.
              cat.children.length > 0 ? (
                <div key={cat.id} className="pt-2">
                  <p className="text-[11px] uppercase tracking-wider text-[#6B6B6B] px-2 pb-1">
                    {cat.name}
                  </p>
                  {cat.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => update("category", child.slug)}
                      className={`w-full text-left text-sm px-2 py-1.5 pl-4 rounded transition-colors ${
                        filters.category === child.slug
                          ? "bg-[#1A1A1A] text-white"
                          : "text-[#1A1A1A] hover:bg-[#F0EDE8]"
                      }`}
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  key={cat.id}
                  onClick={() => update("category", cat.slug)}
                  className={`w-full text-left text-sm px-2 py-1.5 rounded transition-colors ${
                    filters.category === cat.slug
                      ? "bg-[#1A1A1A] text-white"
                      : "text-[#1A1A1A] hover:bg-[#F0EDE8]"
                  }`}
                >
                  {cat.name}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Price range */}
      <div>
        <label className="text-xs uppercase tracking-widest text-[#6B6B6B] block mb-2">
          {t("priceRange")}
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder={t("from")}
            value={localMin}
            onChange={(e) => updatePrice("minPrice", e.target.value)}
            className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4A882]"
          />
          <input
            type="number"
            placeholder={t("to")}
            value={localMax}
            onChange={(e) => updatePrice("maxPrice", e.target.value)}
            className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4A882]"
          />
        </div>
      </div>

      {/* Hair type */}
      <div>
        <label className="text-xs uppercase tracking-widest text-[#6B6B6B] block mb-2">
          {t("hairType")}
        </label>
        <div className="space-y-1">
          {HAIR_TYPES.map((ht) => (
            <label key={ht.value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="hairType"
                value={ht.value}
                checked={filters.hairType === ht.value}
                onChange={() =>
                  update("hairType", filters.hairType === ht.value ? "" : ht.value)
                }
                className="accent-[#C4A882]"
              />
              <span className="text-sm text-[#1A1A1A] group-hover:text-[#C4A882] transition-colors">
                {th(ht.value as "oily" | "dry" | "normal" | "colored" | "damaged" | "curly")}
              </span>
            </label>
          ))}
        </div>
      </div>

      {hasActive && (
        <button
          onClick={reset}
          className="w-full text-sm text-[#C4A882] hover:text-[#A8875E] underline transition-colors text-center"
        >
          {t("resetFilters")}
        </button>
      )}
    </div>
  );
}
