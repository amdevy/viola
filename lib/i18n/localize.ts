/**
 * Localization helper for DB rows with _en columns.
 *
 * Strategy:
 * - On `uk` locale → return row as-is, `hasTranslation = true`
 * - On `en` locale → replace each field with its `_en` counterpart if present,
 *   fall back to UK value if `_en` is empty/null.
 * - `hasTranslation` is true only if **every requested field** has a non-empty EN value.
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
    const enKey = `${field}_en`;
    const enValue = row[enKey];

    if (typeof enValue === "string" && enValue.trim().length > 0) {
      (result as Record<string, unknown>)[field] = enValue;
    } else {
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
    const enValue = row[`${field}_en`];
    if (typeof enValue !== "string" || enValue.trim().length === 0) {
      return false;
    }
  }
  return true;
}

/**
 * Field groups for each content type — single source of truth.
 * Add new translatable fields here when they appear in the DB.
 */
export const PRODUCT_I18N_FIELDS = ["name", "description", "ingredients", "how_to_use"] as const;
export const BLOG_I18N_FIELDS = ["title", "excerpt", "content"] as const;
export const CATEGORY_I18N_FIELDS = ["name"] as const;
