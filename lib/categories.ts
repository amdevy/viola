import type { Category } from "@/types";

/**
 * Категорія показується на сайті лише тоді, коли в ній є хоча б один товар.
 *
 * Порожні розділи (без товарів і без опису) не потрапляють у меню, футер,
 * фільтр каталогу та sitemap, а їхні сторінки віддають 404. Щойно в категорію
 * додано перший товар — вона з'являється всюди автоматично, без змін у коді.
 *
 * Важливий виняток — батьківські категорії. У «Догляд за шкірою» власних
 * товарів немає й не буде: вони лежать у підкатегоріях. Тому тут LEFT JOIN
 * (`products(id)`), а не INNER — інакше батько зник би з меню разом з усією
 * гілкою. Видимість батька рахує `buildCategoryTree` за дітьми.
 */
export const CATEGORY_WITH_PRODUCTS_SELECT = "*, products(id)";

/** Прибирає службове поле `products`, яке додає JOIN. */
export function stripJoinedProducts(rows: unknown[] | null | undefined): Category[] {
  return (rows ?? []).map((row) => {
    const category = { ...(row as Record<string, unknown>) };
    delete category.products;
    return category as unknown as Category;
  });
}

export type CategoryNode = Category & {
  /** Товарів безпосередньо в цій категорії, без урахування дітей. */
  productCount: number;
  /** Непорожні підкатегорії, вже відсортовані. */
  children: CategoryNode[];
};

type RawRow = Record<string, unknown> & { products?: unknown[] };

/**
 * Порядок у меню й фільтрі береться з `categories.sort_order` у базі. Раніше це
 * була захардкоджена мапа в коді, тож змінити порядок або додати категорію без
 * деплою було неможливо. За однакового порядку сортуємо за назвою.
 */
export function sortCategories<
  T extends { slug: string; name: string; sort_order?: number | null },
>(categories: T[]): T[] {
  return [...categories].sort((a, b) => {
    const diff = (a.sort_order ?? 99) - (b.sort_order ?? 99);
    return diff !== 0 ? diff : a.name.localeCompare(b.name, "uk");
  });
}

/**
 * Перетворює плаский список категорій на два рівні й одразу відкидає порожні.
 *
 * Правило видимості:
 *   • звичайна категорія — видима, якщо має хоч один товар;
 *   • батьківська — видима, якщо має товари АБО хоч одну видиму дитину.
 *
 * Друга частина й є суттю: «Догляд за шкірою» тримає нуль власних товарів і
 * живе виключно за рахунок дітей. Без цього вся гілка була б невидима.
 *
 * Глибина навмисно обмежена одним рівнем — цього досить для магазину, а
 * рекурсія без потреби ускладнила б і меню, і хлібні крихти.
 */
export function buildCategoryTree(rows: unknown[] | null | undefined): CategoryNode[] {
  const nodes = new Map<string, CategoryNode>();

  for (const raw of (rows ?? []) as RawRow[]) {
    const category = { ...raw };
    const productCount = Array.isArray(raw.products) ? raw.products.length : 0;
    delete category.products;
    const node = {
      ...(category as unknown as Category),
      productCount,
      children: [],
    } as CategoryNode;
    nodes.set(node.id, node);
  }

  const roots: CategoryNode[] = [];

  for (const node of nodes.values()) {
    const parent = node.parent_id ? nodes.get(node.parent_id) : undefined;
    // A parent_id pointing at a category that no longer exists must not swallow
    // the child — treat it as a root rather than dropping it silently.
    if (parent && parent.id !== node.id) parent.children.push(node);
    else roots.push(node);
  }

  for (const node of nodes.values()) {
    node.children = sortCategories(node.children).filter((c) => c.productCount > 0);
  }

  return sortCategories(roots).filter(
    (node) => node.productCount > 0 || node.children.length > 0,
  );
}

/** Плаский список усіх видимих категорій — для sitemap і фільтра. */
export function flattenCategoryTree(tree: CategoryNode[]): CategoryNode[] {
  return tree.flatMap((node) => [node, ...node.children]);
}

/**
 * Ід-и категорій, товари яких треба показати на сторінці цієї категорії.
 *
 * Для батьківської це вона сама плюс усі діти: сторінка «Догляд за шкірою»
 * мусить показувати справжні товари, а не порожній список посилань. Сторінка з
 * самими лінками — це doorway, і Google цілком справедливо не бачить у ній
 * цінності.
 */
export function categoryIdsForListing(node: CategoryNode): string[] {
  return [node.id, ...node.children.map((c) => c.id)];
}
