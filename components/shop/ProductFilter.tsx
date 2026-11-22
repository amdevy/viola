"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { sendGAEvent } from "@/lib/analytics";
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
  /**
   * Hair types at least one product in the whole catalogue has. Only these
   * are offered: an option no product carries can only return an empty grid.
   */
  availableHairTypes: readonly string[];
}

export default function ProductFilter({ filters, onChange, availableHairTypes }: ProductFilterProps) {
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

  // In HAIR_TYPES order, whatever order the products list them in.
  const hairTypes = HAIR_TYPES.filter((ht) => availableHairTypes.includes(ht.value));

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
          className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-base md:text-sm text-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A882]"
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
              type="button"
              onClick={() => update("category", "")}
              className={`w-full text-left text-sm px-2 py-2.5 md:py-1.5 rounded transition-colors ${
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
                      type="button"
                      onClick={() => update("category", child.slug)}
                      className={`w-full text-left text-sm px-2 py-2.5 md:py-1.5 pl-4 rounded transition-colors ${
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
                  type="button"
                  onClick={() => update("category", cat.slug)}
                  className={`w-full text-left text-sm px-2 py-2.5 md:py-1.5 rounded transition-colors ${
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
        {/* text-base on phones: iOS Safari zooms the page into any field set
            smaller than 16px when it gets focus. */}
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder={t("from")}
            value={localMin}
            onChange={(e) => updatePrice("minPrice", e.target.value)}
            className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-[#C4A882]"
          />
          <input
            type="number"
            inputMode="numeric"
            placeholder={t("to")}
            value={localMax}
            onChange={(e) => updatePrice("maxPrice", e.target.value)}
            className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-[#C4A882]"
          />
        </div>
      </div>

      {/* Hair type — hidden while no product has one, back once some do */}
      {hairTypes.length > 0 && (
        <div>
          <label className="text-xs uppercase tracking-widest text-[#6B6B6B] block mb-2">
            {t("hairType")}
          </label>
          <div className="space-y-1">
            {hairTypes.map((ht) => (
              <label key={ht.value} className="flex items-center gap-2 cursor-pointer group min-h-10 md:min-h-0">
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
      )}

      {hasActive && (
        <button
          type="button"
          onClick={reset}
          className="w-full text-sm text-[#C4A882] hover:text-[#A8875E] underline transition-colors text-center"
        >
          {t("resetFilters")}
        </button>
      )}
    </div>
  );
}
