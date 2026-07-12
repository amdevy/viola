/**
 * Localization helper for DB rows with _en columns.
 *
 * Strategy:
 * - On `uk` locale → return row as-is, `hasTranslation = true`
 * - On `en` locale → replace each field with its `_en` counterpart if present,
 *   fall back to UK value if `_en` is empty/null.
 * - `hasTranslation` is true if every field **that has UK content** also has EN content.
 *   Empty UK fields have nothing to translate, so they never block indexing.
 *   Supports both string and string[] columns (e.g. `benefits text[]`).
 *   Use this flag in `generateMetadata` to decide whether to `noindex` the EN page
 *   (partially-translated pages hurt SEO, better to hide them from Google until ready).
 *
 * Usage:
 * ```ts
 * const { row: product, hasTranslation } = localize(raw, locale, [
 *   "name", "description", "ingredients", "how_to_use"
 * ]);
 *
 * return {
 *   title: product.name,
 *   robots: hasTranslation ? { index: true, follow: true } : { index: false, follow: false },
 * };
 * ```
 */
function hasContent(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return false;
}

export function localize<T extends Record<string, unknown>>(
  row: T,
  locale: string,
  fields: readonly string[],
): { row: T; hasTranslation: boolean } {
  if (locale === "uk") {
    return { row, hasTranslation: true };
  }

  let hasTranslation = true;
  const result = { ...row };

  for (const field of fields) {
    const enValue = row[`${field}_en`];

    if (hasContent(enValue)) {
      (result as Record<string, unknown>)[field] = enValue;
    } else if (hasContent(row[field])) {
      hasTranslation = false;
    }
  }

  return { row: result, hasTranslation };
}

/**
 * Check if a row has full EN translation without mutating it.
 * Useful for sitemap generation — we want to include EN alternates
 * only for fully-translated products/posts.
 */
export function hasEnTranslation<T extends Record<string, unknown>>(
  row: T,
  fields: readonly string[],
): boolean {
  for (const field of fields) {
    if (hasContent(row[field]) && !hasContent(row[`${field}_en`])) {
      return false;
    }
  }
  return true;
}

/**
 * Field groups for each content type — single source of truth.
 * Add new translatable fields here when they appear in the DB.
 */
export const PRODUCT_I18N_FIELDS = ["name", "description", "ingredients", "how_to_use", "benefits"] as const;
export const BLOG_I18N_FIELDS = ["title", "excerpt", "content"] as const;
export const CATEGORY_I18N_FIELDS = ["name"] as const;
