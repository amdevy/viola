/**
 * Which public pages have a markdown version (/<path>.md), and which do not and
 * why. Kept free of data imports so the coverage test can load it on its own.
 *
 * Adding a page: add its pattern here and a renderer in lib/md/registry.ts (the
 * registry's type makes the second step compulsory). /llms.txt and the catalog
 * pick it up from there.
 */

export const MD_PATTERNS = [
  "/",
  "/shop",
  "/shop/category/[slug]",
  "/shop/[slug]",
  "/na-golovy",
  "/about",
  "/poslugy",
  "/delivery",
  "/contacts",
  "/blog",
  "/blog/[slug]",
] as const;

export type MdPattern = (typeof MD_PATTERNS)[number];

/** Public pages with no markdown version, each with the reason. */
export const MD_SKIPPED: Record<string, string> = {
  "/cart": "per-visitor state, nothing to read",
  "/checkout": "order form, noindex",
  "/checkout/success": "per-order status page, noindex",
  "/[...rest]": "catch-all 404",
  "/reviews": "left out of the light version; llms.txt links the HTML page",
  "/offer": "legal text lives in JSX; llms.txt links the HTML page rather than a second copy",
  "/privacy": "legal text lives in JSX; llms.txt links the HTML page rather than a second copy",
  "/terms": "legal text lives in JSX; llms.txt links the HTML page rather than a second copy",
};

export type MdLocale = "uk" | "en";

/** Splits "/en/shop/x" into its locale and the path the patterns describe. */
export function splitLocale(path: string): { locale: MdLocale; path: string } {
  const clean = "/" + path.split("/").filter(Boolean).join("/");
  if (clean === "/en" || clean.startsWith("/en/")) {
    return { locale: "en", path: clean.slice(3) || "/" };
  }
  return { locale: "uk", path: clean };
}

/** Matches a path against the patterns. "/index" is the homepage, as in /index.md. */
export function matchMdPattern(
  path: string,
): { pattern: MdPattern; params: Record<string, string> } | null {
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0 || (segments.length === 1 && segments[0] === "index")) {
    return { pattern: "/", params: {} };
  }

  for (const pattern of MD_PATTERNS) {
    const parts = pattern.split("/").filter(Boolean);
    if (parts.length !== segments.length) continue;

    const params: Record<string, string> = {};
    const matches = parts.every((part, i) => {
      const dynamic = part.match(/^\[(\w+)\]$/);
      if (dynamic) {
        params[dynamic[1]] = decodeURIComponent(segments[i]);
        return true;
      }
      return part === segments[i];
    });
    // "/shop/category" alone must not fall through to "/shop/[slug]".
    if (matches && !(pattern === "/shop/[slug]" && segments[1] === "category")) {
      return { pattern, params };
    }
  }
  return null;
}
