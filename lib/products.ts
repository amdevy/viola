import type { SupabaseClient } from "@supabase/supabase-js";
import { localize, PRODUCT_I18N_FIELDS, CATEGORY_I18N_FIELDS } from "@/lib/i18n/localize";
import type { Product } from "@/types";

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  hairType?: string;
  sort?: string;
  search?: string;
}

/**
 * True when the filters ask for the whole catalogue in the default "popular"
 * order — the list /shop renders on the server. The checks mirror
 * fetchProducts one for one, so `true` means it would run the unfiltered query.
 */
export function isDefaultProductFilters(filters?: ProductFilters): boolean {
  return (
    !filters?.category &&
    !filters?.minPrice &&
    !filters?.maxPrice &&
    !filters?.hairType &&
    !filters?.search &&
    (!filters?.sort || filters.sort === "popular")
  );
}

/**
 * The catalogue query, localized. Shared by the server render of /shop and the
 * client-side filters, so the list in the HTML and the one the filters return
 * to are the same query, not two copies that can drift apart.
 */
export async function fetchProducts(
  supabase: SupabaseClient,
  filters: ProductFilters | undefined,
  locale: string,
): Promise<{ products: Product[]; error: string | null }> {
  let categoryId: string | undefined;
  if (filters?.category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", filters.category)
      .single();
    if (!cat) return { products: [], error: null };
    categoryId = cat.id;
  }

  let query = supabase
    .from("products")
    .select("*, category:categories(id,name,name_en,slug)");

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
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    default:
      query = query
        .order("is_bestseller", { ascending: false })
        .order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) return { products: [], error: error.message };

  const products = (data as Product[]).map((p) => {
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
  return { products, error: null };
}
