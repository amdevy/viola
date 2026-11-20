import { createPublicClient } from "@/lib/supabase/server";
import { localize, PRODUCT_I18N_FIELDS, CATEGORY_I18N_FIELDS } from "@/lib/i18n/localize";
import type { Product } from "@/types";

// Server-only product reads. lib/products.ts is shared with the browser
// (hooks/useProducts), so anything that touches lib/supabase/server lives here.
/** One product with its category, raw (not localized). Null when the slug is unknown. */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(id,name,name_en,slug)")
    .eq("slug", slug)
    .single();
  return (data as Product) ?? null;
}

/** Products of the given categories, newest first, raw (not localized). */
export async function getProductsByCategoryIds(categoryIds: string[]): Promise<Product[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(id,name,name_en,slug)")
    .in("category_id", categoryIds)
    .order("created_at", { ascending: false });
  return (data as Product[]) ?? [];
}

/** The newest products, localized — the "popular products" row on /na-golovy. */
export async function getLatestProducts(locale: string, limit: number): Promise<Product[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(id,name,name_en,slug)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data as Product[]) ?? []).map((p) => {
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
}
