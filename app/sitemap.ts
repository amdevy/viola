import { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/server";
import { hasEnTranslation, PRODUCT_I18N_FIELDS, BLOG_I18N_FIELDS } from "@/lib/i18n/localize";
import { lastModified } from "@/lib/seo-freshness";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";

export const revalidate = 3600;

function withAlternates(path: string, includeEn = true) {
  const ukUrl = `${BASE}${path}`;
  const enUrl = `${BASE}/en${path}`;
  return {
    languages: includeEn ? { uk: ukUrl, en: enUrl } : { uk: ukUrl },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();

  const [{ data: products }, { data: posts }, { data: categories }] = await Promise.all([
    // Out-of-stock products too: their pages stay live, indexable and linked
    // from /shop (with OutOfStock offers), so leaving them out of the sitemap
    // only contradicts the page and delays Google finding them.
    supabase
      .from("products")
      .select(
        "slug, created_at, in_stock, category_id, name, name_en, description, description_en, ingredients, ingredients_en, how_to_use, how_to_use_en, benefits, benefits_en",
      ),
    supabase
      .from("blog_posts")
      .select("slug, created_at, title, title_en, excerpt, excerpt_en, content, content_en")
      .eq("published", true),
    // `*` rather than an explicit list: parent_id only exists after migration
    // 013, and naming a missing column makes PostgREST fail the whole request —
    // which would empty the sitemap instead of just skipping one field.
    supabase.from("categories").select("*"),
  ]);

  const { data: productCategoryIds } = await supabase
    .from("products")
    .select("category_id")
    .eq("in_stock", true);

  const directlyStocked = new Set(
    (productCategoryIds ?? []).map((p) => p.category_id).filter(Boolean),
  );

  // A parent category holds no products of its own — its page lists the
  // children's. Judging it by direct stock alone would drop "Догляд за шкірою"
  // from the sitemap while every subcategory under it is indexed.
  const nonEmptyCategoryIds = new Set(directlyStocked);
  for (const c of categories ?? []) {
    if (c.parent_id && directlyStocked.has(c.id)) nonEmptyCategoryIds.add(c.parent_id);
  }

  // `lastmod` is the later of the page's data and its template — see
  // lib/seo-freshness.ts for why `created_at` alone left Google re-reading the
  // shop every two months.
  const productDates = (products ?? []).map((p) => p.created_at);
  const postDates = (posts ?? []).map((p) => p.created_at);

  // Newest product per category, counted for the parent as well: a parent page
  // lists its children's products, so a new one changes both.
  const newestInCategory = new Map<string, string>();
  const noteProduct = (categoryId: string | null | undefined, createdAt: string | null) => {
    if (!categoryId || !createdAt) return;
    const known = newestInCategory.get(categoryId);
    if (!known || createdAt > known) newestInCategory.set(categoryId, createdAt);
  };
  const parentOf = new Map((categories ?? []).map((c) => [c.id, c.parent_id as string | null]));
  for (const p of products ?? []) {
    noteProduct(p.category_id, p.created_at);
    noteProduct(parentOf.get(p.category_id), p.created_at);
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: lastModified("home", ...productDates, ...postDates), changeFrequency: "weekly", priority: 1, alternates: withAlternates("") },
    { url: `${BASE}/shop`, lastModified: lastModified("shop", ...productDates), changeFrequency: "daily", priority: 0.9, alternates: withAlternates("/shop") },
    { url: `${BASE}/na-golovy`, lastModified: lastModified("brandHub"), changeFrequency: "monthly", priority: 0.9, alternates: withAlternates("/na-golovy") },
    { url: `${BASE}/about`, lastModified: lastModified("about"), changeFrequency: "monthly", priority: 0.7, alternates: withAlternates("/about") },
    { url: `${BASE}/contacts`, lastModified: lastModified("contacts"), changeFrequency: "monthly", priority: 0.7, alternates: withAlternates("/contacts") },
    { url: `${BASE}/blog`, lastModified: lastModified("blogIndex", ...postDates), changeFrequency: "weekly", priority: 0.7, alternates: withAlternates("/blog") },
    { url: `${BASE}/reviews`, lastModified: lastModified("reviews"), changeFrequency: "weekly", priority: 0.6, alternates: withAlternates("/reviews") },
    { url: `${BASE}/poslugy`, lastModified: lastModified("services"), changeFrequency: "monthly", priority: 0.7, alternates: withAlternates("/poslugy") },
    { url: `${BASE}/delivery`, lastModified: lastModified("delivery"), changeFrequency: "monthly", priority: 0.5, alternates: withAlternates("/delivery") },
    { url: `${BASE}/offer`, lastModified: lastModified("legal"), changeFrequency: "yearly", priority: 0.3, alternates: withAlternates("/offer", false) },
    { url: `${BASE}/privacy`, lastModified: lastModified("legal"), changeFrequency: "yearly", priority: 0.3, alternates: withAlternates("/privacy", false) },
    { url: `${BASE}/terms`, lastModified: lastModified("legal"), changeFrequency: "yearly", priority: 0.3, alternates: withAlternates("/terms", false) },
  ];

  const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((p) => {
    const fullyTranslated = hasEnTranslation(
      p as unknown as Record<string, unknown>,
      PRODUCT_I18N_FIELDS,
    );
    return {
      url: `${BASE}/shop/${p.slug}`,
      lastModified: lastModified("product", p.created_at),
      changeFrequency: "weekly",
      priority: p.in_stock ? 0.8 : 0.5,
      alternates: withAlternates(`/shop/${p.slug}`, fullyTranslated),
    };
  });

  const blogRoutes: MetadataRoute.Sitemap = (posts ?? []).map((post) => {
    const fullyTranslated = hasEnTranslation(
      post as unknown as Record<string, unknown>,
      BLOG_I18N_FIELDS,
    );
    return {
      url: `${BASE}/blog/${post.slug}`,
      lastModified: lastModified("blogPost", post.created_at),
      changeFrequency: "monthly",
      priority: 0.6,
      alternates: withAlternates(`/blog/${post.slug}`, fullyTranslated),
    };
  });

  const categoryRoutes: MetadataRoute.Sitemap = (categories ?? [])
    .filter((c) => nonEmptyCategoryIds.has(c.id))
    .map((c) => ({
      url: `${BASE}/shop/category/${c.slug}`,
      lastModified: lastModified("category", c.created_at, newestInCategory.get(c.id)),
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: withAlternates(`/shop/category/${c.slug}`),
    }));

  return [...staticRoutes, ...productRoutes, ...blogRoutes, ...categoryRoutes];
}
