"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { localize, PRODUCT_I18N_FIELDS, CATEGORY_I18N_FIELDS } from "@/lib/i18n/localize";
import type { Product, Category } from "@/types";

export function useProducts(filters?: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  hairType?: string;
  sort?: string;
  search?: string;
}) {
  const locale = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const supabase = createClient();

      let categoryId: string | undefined;
      if (filters?.category) {
        const { data: cat } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", filters.category)
          .single();
        if (!cat) {
          setProducts([]);
          setLoading(false);
          return;
        }
        categoryId = cat.id;
      }

      let query = supabase
        .from("products")
        .select("*, category:categories(id,name,name_en,slug)")
        .eq("in_stock", true);

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }
      if (filters?.minPrice) query = query.gte("price", filters.minPrice);
      if (filters?.maxPrice) query = query.lte("price", filters.maxPrice);
      if (filters?.hairType) {
        query = query.contains("hair_type", [filters.hairType]);
      }
      if (filters?.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }

      switch (filters?.sort) {
        case "price_asc":
          query = query.order("price", { ascending: true });
          break;
        case "price_desc":
          query = query.order("price", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) {
        setError(error.message);
      } else {
        const localized = (data as Product[]).map((p) => {
          const { row } = localize(
            p as unknown as Record<string, unknown>,
            locale,
            PRODUCT_I18N_FIELDS,
          ) as unknown as { row: Product };
          if (row.category) {
            const { row: cat } = localize(
              row.category as unknown as Record<string, unknown>,
              locale,
              CATEGORY_I18N_FIELDS,
            ) as unknown as { row: typeof row.category };
            row.category = cat;
          }
          return row;
        });
        setProducts(localized);
      }
      setLoading(false);
    };

    fetch();
  }, [
    filters?.category,
    filters?.minPrice,
    filters?.maxPrice,
    filters?.hairType,
    filters?.sort,
    filters?.search,
    locale,
  ]);

  return { products, loading, error };
}

export function useCategories() {
  const locale = useLocale();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      const localized = (data ?? []).map((c) => {
        const { row } = localize(
          c as unknown as Record<string, unknown>,
          locale,
          CATEGORY_I18N_FIELDS,
        ) as unknown as { row: Category };
        return row;
      });
      setCategories(localized);
      setLoading(false);
    };
    fetch();
  }, [locale]);

  return { categories, loading };
}
