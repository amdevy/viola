import type { Category } from "@/types";

/**
 * Категорія показується на сайті лише тоді, коли в ній є хоча б один товар.
 *
 * Порожні розділи (без товарів і без опису) не потрапляють у меню, футер,
 * фільтр каталогу та sitemap, а їхні сторінки віддають 404. Щойно в категорію
 * додано перший товар — вона з'являється всюди автоматично, без змін у коді.
 *
 * `products!inner(id)` — це INNER JOIN на боці Supabase: категорії без товарів
 * просто не повертаються запитом.
 */
export const NON_EMPTY_CATEGORY_SELECT = "*, products!inner(id)";

/** Прибирає службове поле `products`, яке додає INNER JOIN. */
export function stripJoinedProducts(rows: unknown[] | null | undefined): Category[] {
  return (rows ?? []).map((row) => {
    const category = { ...(row as Record<string, unknown>) };
    delete category.products;
    return category as unknown as Category;
  });
}

/**
 * Порядок категорій у меню та фільтрі. Категорії, яких немає в списку
 * (нові або ті, що щойно наповнили), показуються в кінці за алфавітом.
 */
const CATEGORY_ORDER: Record<string, number> = {
  shampoos: 1,
  "peeling-shampoos": 2,
  conditioners: 3,
  masks: 4,
  "leave-in": 5,
  "styling-brushes": 6,
  additions: 7,
  "gift-sets": 8,
};

export function sortCategories<T extends { slug: string; name: string }>(
  categories: T[],
): T[] {
  return [...categories].sort((a, b) => {
    const diff = (CATEGORY_ORDER[a.slug] ?? 99) - (CATEGORY_ORDER[b.slug] ?? 99);
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });
}
