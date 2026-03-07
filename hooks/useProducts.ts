"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Product, Category } from "@/types";

export function useProducts(filters?: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  hairType?: string;
  sort?: string;
  search?: string;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const supabase = createClient();

      let query = supabase
        .from("products")
        .select("*, category:categories(id,name,slug)")
        .eq("in_stock", true);

      if (filters?.category) {
        query = query.eq("categories.slug", filters.category);
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
      if (error) setError(error.message);
      else setProducts(data as Product[]);
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
  ]);

  return { products, loading, error };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      setCategories(data ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  return { categories, loading };
}
