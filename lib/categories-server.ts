import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/server";
import { localize, CATEGORY_I18N_FIELDS } from "@/lib/i18n/localize";
import {
  CATEGORY_WITH_PRODUCTS_SELECT,
  buildCategoryTree,
  flattenCategoryTree,
  type CategoryNode,
} from "@/lib/categories";
import type { Category } from "@/types";

/**
 * The category tree, resolved on the server so the menu ships inside the HTML.
 *
 * Header and Footer used to fetch this themselves from a client effect, which
 * meant every link to a category page appeared only after JavaScript ran. Those
 * are the strongest internal links on the site — sitewide, pointing at the
 * pages that carry the long-form SEO content — and a crawler should not have to
 * execute the page to find them.
 *
 * Wrapped in React `cache` so one render fetches once no matter how many
 * components ask. Freshness comes from the layout's `revalidate`.
 */
export const getCategoryTree = cache(
  async (locale: string): Promise<CategoryNode[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("categories")
      .select(CATEGORY_WITH_PRODUCTS_SELECT);

    if (error) {
      // A menu is not worth a 500. Log it and render the rest of the page.
      console.error("getCategoryTree: category fetch failed", error);
      return [];
    }

    const localized = (data ?? []).map((row) => {
      const { products, ...rest } = row as Record<string, unknown>;
      const { row: translated } = localize(
        rest,
        locale,
        CATEGORY_I18N_FIELDS,
      ) as unknown as { row: Record<string, unknown> };
      return { ...translated, products };
    });

    return buildCategoryTree(localized);
  },
);

export type CategoryContext = {
  category: Category;
  /** Set only for a subcategory — drives the extra breadcrumb level. */
  parent: Category | null;
  /** Set only for a parent — its non-empty subcategories. */
  children: Category[];
  /** Top of the branch: decides which product line's branding applies. */
  rootSlug: string;
  /** Every category whose products belong on this page. */
  listingIds: string[];
};

/**
 * Loads the category together with the branch it sits in.
 *
 * A parent page lists its children's products rather than its own (it has
 * none): a page that is only a list of links to other pages is a doorway, and
 * carries no weight of its own.
 */
export async function getCategoryContext(slug: string): Promise<CategoryContext | null> {
  const supabase = createPublicClient();
  const { data } = await supabase.from("categories").select(CATEGORY_WITH_PRODUCTS_SELECT);
  const all = flattenCategoryTree(buildCategoryTree(data));

  const node = all.find((c) => c.slug === slug);
  if (!node) return null;

  const parent = node.parent_id
    ? (all.find((c) => c.id === node.parent_id) as Category | undefined) ?? null
    : null;
  const children = all.filter((c) => c.parent_id === node.id) as Category[];

  return {
    category: node as Category,
    parent,
    children,
    rootSlug: parent?.slug ?? node.slug,
    listingIds: [node.id, ...children.map((c) => c.id)],
  };
}
