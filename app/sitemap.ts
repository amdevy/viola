import { createClient as createBrowserClient } from "@supabase/supabase-js";
import { MetadataRoute } from "next";
import { hasEnTranslation, PRODUCT_I18N_FIELDS, BLOG_I18N_FIELDS } from "@/lib/i18n/localize";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";

export const dynamic = "force-dynamic";

function withAlternates(path: string, includeEn = true) {
  const ukUrl = `${BASE}${path}`;
  const enUrl = `${BASE}/en${path}`;
  return {
    languages: includeEn ? { uk: ukUrl, en: enUrl } : { uk: ukUrl },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [{ data: products }, { data: posts }] = await Promise.all([
    supabase
      .from("products")
      .select("slug, created_at, name_en, description_en, ingredients_en, how_to_use_en")
      .eq("in_stock", true),
    supabase
      .from("blog_posts")
      .select("slug, created_at, title_en, excerpt_en, content_en")
      .eq("published", true),
  ]);

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
    { url: `${BASE}/offer`, lastModified: new Date("2026-04-13"), changeFrequency: "yearly", priority: 0.3, alternates: withAlternates("/offer") },
    { url: `${BASE}/privacy`, lastModified: new Date("2026-04-13"), changeFrequency: "yearly", priority: 0.3, alternates: withAlternates("/privacy") },
    { url: `${BASE}/terms`, lastModified: new Date("2026-04-13"), changeFrequency: "yearly", priority: 0.3, alternates: withAlternates("/terms") },
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

  return [...staticRoutes, ...productRoutes, ...blogRoutes];
}
