import { listMarkdownRoutes, type MdRouteEntry } from "@/lib/md/registry";
import { htmlUrl, link, mdUrl } from "@/lib/md/format";
import { SITE, SITE_URL } from "@/lib/site";

/**
 * /llms.txt (llmstxt.org): a map of the site for language models, built from
 * the same registry as the markdown pages, so it never goes stale.
 * Keep in sync with app/robots.ts: the paths robots.txt disallows are never listed here.
 */

export const revalidate = 86400;

const line = (e: MdRouteEntry) =>
  `- ${link(e.title, mdUrl(e.path, "uk"))}${e.description ? `: ${e.description.replace(/\s+/g, " ").trim()}` : ""}`;

export async function GET() {
  const entries = await listMarkdownRoutes("uk");
  const section = (name: MdRouteEntry["section"]) => entries.filter((e) => e.section === name).map(line).join("\n");

  const body = `# Viola — Na Gólov[y] hair cosmetics store

> Viola (${SITE_URL}) is the online store of Viola Hehedosh (Віола Гегедош), an accredited technologist of the Ukrainian niche professional hair cosmetics brand Na Gólov[y] (На Голову, Na Golovy). It sells the brand's shampoos, conditioners, masks and leave-in care with Nova Poshta delivery across Ukraine, plus free personal product consultation.

Key facts:
- Na Gólov[y] is sold only through accredited masters and salons, not in mass-market retail. Official brand site: ${SITE.brandUrl}
- The store belongs to the Viola beauty salon in Mukachevo, Zakarpattia region, Ukraine.
- Payment: 100% prepayment via LiqPay or bank transfer. Delivery: Nova Poshta across Ukraine at the carrier's rates. Orders placed Monday–Saturday before 15:00 ship the same day, later ones the next morning (Saturday after 14:00 and Sunday orders on Monday); delivery usually takes 1–3 days.
- Returns: cosmetics of proper quality cannot be returned or exchanged (Cabinet of Ministers resolution No. 172); a damaged parcel can be refused on delivery.
- Languages: Ukrainian (default, ${SITE_URL}) and English (${SITE_URL}/en).
- Contact: ${SITE.phoneDisplay}, Telegram ${SITE.telegram}, Instagram ${SITE.instagram}.

Every link below is the markdown version of a page; drop ".md" for the HTML page. English versions live under /en (for example ${mdUrl("/", "en")}).

## Core pages
${section("core")}

## Categories
${section("categories")}

## Products (in stock)
${section("products")}

## Blog
${section("blog")}

## Machine-readable
- [Markdown catalog](${SITE_URL}/api/md/_catalog): every markdown page in both languages
- [Sitemap](${SITE_URL}/sitemap.xml)
- [RSS](${SITE_URL}/feed.xml): blog feed

## Optional
- [Public offer](${htmlUrl("/offer", "uk")}): terms of sale (HTML, Ukrainian only)
- [Terms of use](${htmlUrl("/terms", "uk")}) (HTML, Ukrainian only)
- [Privacy policy](${htmlUrl("/privacy", "uk")}) (HTML, Ukrainian only)
- [Reviews](${htmlUrl("/reviews", "uk")}) (HTML)
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
