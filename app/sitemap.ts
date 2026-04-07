import { createClient } from "@/lib/supabase/server";
import { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: products }, { data: posts }] = await Promise.all([
    supabase.from("products").select("slug, updated_at").eq("in_stock", true),
    supabase.from("blog_posts").select("slug, updated_at").eq("published", true),
  ]);

  // Use the most recent product update as a proxy for shop/home freshness
  const latestProduct = (products ?? []).reduce((latest, p) => {
    if (!p.updated_at) return latest;
    const d = new Date(p.updated_at);
    return d > latest ? d : latest;
  }, new Date("2026-03-01"));

  const latestPost = (posts ?? []).reduce((latest, p) => {
    if (!p.updated_at) return latest;
    const d = new Date(p.updated_at);
    return d > latest ? d : latest;
  }, new Date("2026-03-01"));

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: latestProduct, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/shop`, lastModified: latestProduct, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/about`, lastModified: new Date("2026-04-01"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/contacts`, lastModified: new Date("2026-04-01"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/blog`, lastModified: latestPost, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/reviews`, lastModified: new Date("2026-04-01"), changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/poslugy`, lastModified: new Date("2026-04-07"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/delivery`, lastModified: new Date("2026-04-01"), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/offer`, lastModified: new Date("2026-03-01"), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/privacy`, lastModified: new Date("2026-03-01"), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: new Date("2026-03-01"), changeFrequency: "yearly", priority: 0.3 },
  ];

  const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${BASE}/shop/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const blogRoutes: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...blogRoutes];
}
