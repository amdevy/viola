import { createPublicClient } from "@/lib/supabase/server";

export const revalidate = 3600;

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const supabase = createPublicClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, title, excerpt, published_at, cover_image")
    .eq("published", true)
    .order("published_at", { ascending: false })
    .limit(50);

  const items = (posts ?? [])
    .map((p) => {
      const url = `${BASE}/blog/${p.slug}`;
      const pubDate = p.published_at ? new Date(p.published_at).toUTCString() : new Date().toUTCString();
      return `
    <item>
      <title>${escapeXml(p.title ?? "")}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(p.excerpt ?? "")}</description>
      ${p.cover_image ? `<enclosure url="${escapeXml(p.cover_image)}" type="image/jpeg"/>` : ""}
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Viola — Na Gólov[y] Блог</title>
    <link>${BASE}/blog</link>
    <atom:link href="${BASE}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>Поради по догляду за волоссям від технолога бренду Na Gólov[y]</description>
    <language>uk</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
