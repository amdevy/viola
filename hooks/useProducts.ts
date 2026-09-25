"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { localize, CATEGORY_I18N_FIELDS } from "@/lib/i18n/localize";
import {
  CATEGORY_WITH_PRODUCTS_SELECT,
  buildCategoryTree,
  flattenCategoryTree,
  type CategoryNode,
} from "@/lib/categories";
import {
  fetchProducts,
  isDefaultProductFilters,
  type ProductFilters,
} from "@/lib/products";
import type { Product } from "@/types";

type ProductsResult = { key: string; products: Product[]; error: string | null };

/**
 * `initialProducts` is the unfiltered catalogue the server rendered. While the
 * filters are at their default it is returned as is and nothing is fetched;
 * every other filter set is fetched here. `null` — the server couldn't load
 * the list — means the default list is fetched too.
 */
export function useProducts(
  filters?: ProductFilters,
  initialProducts: Product[] | null = null,
) {
  const locale = useLocale();
  const { category, minPrice, maxPrice, hairType, sort, search } = filters ?? {};
  const fromServer =
    initialProducts !== null &&
    isDefaultProductFilters({ category, minPrice, maxPrice, hairType, sort, search });
  // Tags each result with the query it answers: `loading` is simply "the result
  // on hand is for some other query", and a late response can't pass for a newer one.
  const key = JSON.stringify([locale, category, minPrice, maxPrice, hairType, sort, search]);
  const [result, setResult] = useState<ProductsResult | null>(null);

  // Back on the default list: drop the filtered result, so coming back to the
  // same filters shows the skeleton and refetches instead of the stale list.
  if (fromServer && result !== null) setResult(null);

  useEffect(() => {
    if (fromServer) return;
    let ignore = false;
    fetchProducts(
      createClient(),
      { category, minPrice, maxPrice, hairType, sort, search },
      locale,
    ).then((res) => {
      if (!ignore) setResult({ key, ...res });
    });
    return () => {
      ignore = true;
    };
  }, [fromServer, key, category, minPrice, maxPrice, hairType, sort, search, locale]);

  if (fromServer) return { products: initialProducts, loading: false, error: null };
  return {
    products: result?.products ?? [],
    loading: result?.key !== key,
    error: result?.error ?? null,
  };
}

export function useCategories() {
  const locale = useLocale();
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      // LEFT JOIN, а не INNER: батьківські категорії власних товарів не мають,
      // і фільтрація порожніх відбувається вже в buildCategoryTree, яке вміє
      // залишити батька живим заради непорожніх дітей. Див. lib/categories.ts.
      // Порядок задає buildCategoryTree у JS, а не PostgREST. Сортувати тут по
      // sort_order було б жорсткою залежністю від міграції: доки колонки немає,
      // запит повертав би помилку, і меню зникло б цілком.
      const { data } = await supabase.from("categories").select(CATEGORY_WITH_PRODUCTS_SELECT);

      const localized = (data ?? []).map((row) => {
        const { products, ...rest } = row as Record<string, unknown>;
        const { row: translated } = localize(
          rest,
          locale,
          CATEGORY_I18N_FIELDS,
        ) as unknown as { row: Record<string, unknown> };
        return { ...translated, products };
      });

      setTree(buildCategoryTree(localized));
      setLoading(false);
    };
    fetch();
  }, [locale]);

  // `categories` лишається пласким списком усього видимого — таким його чекають
  // фільтр каталогу й footer. `tree` потрібне лише там, де малюється два рівні.
  return { categories: flattenCategoryTree(tree), tree, loading };
}
