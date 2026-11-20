/**
 * `lastmod` for the sitemap: when a page last changed in a way a crawler should
 * re-read.
 *
 * The sitemap used to take it from `created_at` — of the category, of the
 * product — and from dates typed in by hand in April. Nothing in the database
 * records an edit, so every URL told Google "unchanged since spring" while the
 * titles, H1s and copy were rewritten in September. The effect was visible in
 * URL Inspection on 2026-11-19: /shop/category/masks last crawled 2026-09-18,
 * five days BEFORE the rewrite it was supposed to pick up; /na-golovy last
 * crawled 2026-10-11.
 *
 * A page is its data plus its template, so `lastmod` is the later of the two.
 * The template half lives here: when you change a page's markup, copy or
 * structured data, set its date in the same commit. Leave the others alone — a
 * `lastmod` that moves on every deploy is one Google learns to ignore.
 */
export const TEMPLATE_UPDATED = {
  // 2026-09-23/24: the title template was removed and every title rewritten,
  // so no page is older than that.
  home: "2026-09-27",
  shop: "2026-11-19",
  category: "2026-11-19",
  product: "2026-11-19",
  brandHub: "2026-09-24",
  about: "2026-09-24",
  contacts: "2026-09-24",
  blogIndex: "2026-09-24",
  blogPost: "2026-09-24",
  reviews: "2026-09-24",
  services: "2026-09-24",
  delivery: "2026-09-24",
  legal: "2026-09-24",
} as const;

export type TemplateName = keyof typeof TEMPLATE_UPDATED;

type DateInput = string | Date | null | undefined;

/** The later of the template's date and the newest valid data date. */
export function lastModified(template: TemplateName, ...dataDates: DateInput[]): Date {
  let latest = new Date(TEMPLATE_UPDATED[template]);
  for (const value of dataDates) {
    if (!value) continue;
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isNaN(date.getTime()) && date > latest) latest = date;
  }
  return latest;
}
