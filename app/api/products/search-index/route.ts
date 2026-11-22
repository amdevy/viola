import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";
import type { SearchProduct } from "@/lib/search";

// The whole catalogue in the few fields the search overlay shows. It is the
// same for every visitor, so it is cached: the browser asks once per visit and
// then matches locally (see lib/search.ts).
export const revalidate = 600;

type CategoryNames = { name: string | null; name_en: string | null };

interface Row {
  id: string;
  slug: string;
  name: string;
  name_en: string | null;
  price: number;
  images: string[] | null;
  volume: string | null;
  in_stock: boolean;
  is_coming_soon: boolean;
  is_bestseller: boolean;
  // PostgREST returns a to-one embed as an object, but the generated types
  // allow an array, so both shapes are handled.
  category: CategoryNames | CategoryNames[] | null;
}

export async function GET() {
  const { data, error } = await createPublicClient()
    .from("products")
    .select(
      "id, slug, name, name_en, price, images, volume, in_stock, is_coming_soon, is_bestseller, category:categories(name,name_en)",
    )
    .order("is_bestseller", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("search-index: product fetch failed", error.message);
    // Not cached: the next open of the search should try again.
    return NextResponse.json(
      { error: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const products: SearchProduct[] = ((data ?? []) as unknown as Row[]).map((row) => {
    const category = Array.isArray(row.category) ? row.category[0] : row.category;
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      name_en: row.name_en,
      price: Number(row.price),
      image: row.images?.[0]?.trim() || null,
      volume: row.volume,
      category: category?.name ?? null,
      category_en: category?.name_en ?? null,
      in_stock: row.in_stock,
      is_coming_soon: row.is_coming_soon,
      is_bestseller: row.is_bestseller,
    };
  });

  return NextResponse.json(
    { products },
    { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400" } },
  );
}
