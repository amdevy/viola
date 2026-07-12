import { NextRequest, NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f-]{36}$/i;

interface ProductRow {
  id: string;
  name: string;
  name_en: string | null;
  slug: string;
  price: number;
  images: string[] | null;
  volume: string | null;
  category_id: string | null;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const excludeParam = url.searchParams.get("exclude") ?? "";
  const excludeIds = new Set(
    excludeParam
      .split(",")
      .map((s) => s.trim())
      .filter((s) => UUID_RE.test(s)),
  );

  const supabase = createPublicClient();

  // Categories of items already in cart — we want to recommend
  // *complementary* products (shampoo in cart → mask / leave-in / tonic).
  const excludeCategoryIds = new Set<string>();
  if (excludeIds.size > 0) {
    const { data: cartRows } = await supabase
      .from("products")
      .select("category_id")
      .in("id", Array.from(excludeIds));
    for (const row of cartRows ?? []) {
      if (row.category_id) excludeCategoryIds.add(row.category_id);
    }
  }

  // Fetch a wide candidate pool and filter in-memory. Product catalog
  // is small (< 100 rows), so this is cheaper than juggling PostgREST
  // list-escaping for UUIDs and safer to reason about.
  const { data: pool } = await supabase
    .from("products")
    .select("id, name, name_en, slug, price, images, volume, category_id")
    .eq("in_stock", true)
    .eq("is_coming_soon", false)
    .order("is_bestseller", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30);

  const rows = (pool ?? []) as ProductRow[];

  // Only keep candidates that are BOTH not in the cart AND from a
  // different category than anything in the cart. No fallback — better
  // to show fewer relevant items than pad with same-category dupes.
  const products = rows.filter(
    (p) =>
      !excludeIds.has(p.id) &&
      (!p.category_id || !excludeCategoryIds.has(p.category_id)),
  );

  return NextResponse.json({ products: products.slice(0, 6) });
}
