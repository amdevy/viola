"use client";

import { useState, useEffect, useRef } from "react";
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

const CATEGORY_ORDER: Record<string, number> = {
  shampoos: 1,
  masks: 2,
  conditioners: 3,
  "leave-in": 4,
  gifts: 5,
  additions: 6,
};

export default function ProductFilter({ filters, onChange }: ProductFilterProps) {
  const { categories } = useCategories();
  const sortedCategories = [...categories].sort(
    (a, b) => (CATEGORY_ORDER[a.slug] ?? 99) - (CATEGORY_ORDER[b.slug] ?? 99)
  );

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
    }, 400);
  };

  const update = (key: keyof FilterState, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const reset = () => {
    onChange({ category: "", minPrice: "", maxPrice: "", hairType: "", sort: "newest" });
  };

  const hasActive =
    filters.category || filters.minPrice || filters.maxPrice || filters.hairType;

  return (
    <div className="space-y-6">
      {/* Sort */}
      <div>
        <label className="text-xs uppercase tracking-widest text-[#6B6B6B] block mb-2">
          Сортування
        </label>
        <select
          value={filters.sort}
          onChange={(e) => update("sort", e.target.value)}
          className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-sm text-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A882]"
        >
          <option value="newest">Новинки</option>
          <option value="price_asc">Ціна: зростання</option>
          <option value="price_desc">Ціна: спадання</option>
        </select>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <label className="text-xs uppercase tracking-widest text-[#6B6B6B] block mb-2">
            Категорія
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
              Всі категорії
            </button>
            {sortedCategories.map((cat) => (
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
            ))}
          </div>
        </div>
      )}

      {/* Price range */}
      <div>
        <label className="text-xs uppercase tracking-widest text-[#6B6B6B] block mb-2">
          Ціна (грн)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Від"
            value={localMin}
            onChange={(e) => updatePrice("minPrice", e.target.value)}
            className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4A882]"
          />
          <input
            type="number"
            placeholder="До"
            value={localMax}
            onChange={(e) => updatePrice("maxPrice", e.target.value)}
            className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4A882]"
          />
        </div>
      </div>

      {/* Hair type */}
      <div>
        <label className="text-xs uppercase tracking-widest text-[#6B6B6B] block mb-2">
          Тип волосся
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
                {ht.label}
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
          Скинути фільтри
        </button>
      )}
    </div>
  );
}
