import { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/server";
import { hasEnTranslation, PRODUCT_I18N_FIELDS, BLOG_I18N_FIELDS } from "@/lib/i18n/localize";

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
    supabase
      .from("products")
      .select(
        "slug, created_at, name, name_en, description, description_en, ingredients, ingredients_en, how_to_use, how_to_use_en, benefits, benefits_en",
      )
      .eq("in_stock", true),
    supabase
      .from("blog_posts")
      .select("slug, created_at, title, title_en, excerpt, excerpt_en, content, content_en")
      .eq("published", true),
    supabase.from("categories").select("slug, created_at, id"),
  ]);

  const { data: productCategoryIds } = await supabase
    .from("products")
    .select("category_id")
    .eq("in_stock", true);

  const nonEmptyCategoryIds = new Set(
    (productCategoryIds ?? []).map((p) => p.category_id).filter(Boolean),
  );

  // Use the most recent product as a proxy for shop/home freshness
  const latestProduct = (products ?? []).reduce((latest, p) => {
    if (!p.created_at) return latest;
    const d = new Date(p.created_at);
    return d > latest ? d : latest;
  }, new Date("2026-03-01"));

  const latestPost = (posts ?? []).reduce((latest, p) => {
    if (!p.created_at) return latest;
    const d = new Date(p.created_at);
    return d > latest ? d : latest;
  }, new Date("2026-03-01"));

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: latestProduct, changeFrequency: "weekly", priority: 1, alternates: withAlternates("") },
    { url: `${BASE}/shop`, lastModified: latestProduct, changeFrequency: "daily", priority: 0.9, alternates: withAlternates("/shop") },
    { url: `${BASE}/na-golovy`, lastModified: new Date("2026-04-15"), changeFrequency: "monthly", priority: 0.9, alternates: withAlternates("/na-golovy") },
    { url: `${BASE}/about`, lastModified: new Date("2026-04-13"), changeFrequency: "monthly", priority: 0.7, alternates: withAlternates("/about") },
    { url: `${BASE}/contacts`, lastModified: new Date("2026-04-13"), changeFrequency: "monthly", priority: 0.7, alternates: withAlternates("/contacts") },
    { url: `${BASE}/blog`, lastModified: latestPost, changeFrequency: "weekly", priority: 0.7, alternates: withAlternates("/blog") },
    { url: `${BASE}/reviews`, lastModified: new Date("2026-04-13"), changeFrequency: "weekly", priority: 0.6, alternates: withAlternates("/reviews") },
    { url: `${BASE}/poslugy`, lastModified: new Date("2026-04-13"), changeFrequency: "monthly", priority: 0.7, alternates: withAlternates("/poslugy") },
    { url: `${BASE}/delivery`, lastModified: new Date("2026-04-13"), changeFrequency: "monthly", priority: 0.5, alternates: withAlternates("/delivery") },
    { url: `${BASE}/offer`, lastModified: new Date("2026-04-13"), changeFrequency: "yearly", priority: 0.3, alternates: withAlternates("/offer", false) },
    { url: `${BASE}/privacy`, lastModified: new Date("2026-04-13"), changeFrequency: "yearly", priority: 0.3, alternates: withAlternates("/privacy", false) },
    { url: `${BASE}/terms`, lastModified: new Date("2026-04-13"), changeFrequency: "yearly", priority: 0.3, alternates: withAlternates("/terms", false) },
  ];

  const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((p) => {
    const fullyTranslated = hasEnTranslation(
      p as unknown as Record<string, unknown>,
      PRODUCT_I18N_FIELDS,
    );
    return {
      url: `${BASE}/shop/${p.slug}`,
      lastModified: p.created_at ? new Date(p.created_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
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
      lastModified: post.created_at ? new Date(post.created_at) : new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
      alternates: withAlternates(`/blog/${post.slug}`, fullyTranslated),
    };
  });

  const categoryRoutes: MetadataRoute.Sitemap = (categories ?? [])
    .filter((c) => nonEmptyCategoryIds.has(c.id))
    .map((c) => ({
      url: `${BASE}/shop/category/${c.slug}`,
      lastModified: c.created_at ? new Date(c.created_at) : new Date("2026-04-17"),
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: withAlternates(`/shop/category/${c.slug}`),
    }));

  return [...staticRoutes, ...productRoutes, ...blogRoutes, ...categoryRoutes];
}
