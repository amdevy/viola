import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/server";
import { localize, CATEGORY_I18N_FIELDS } from "@/lib/i18n/localize";
import {
  CATEGORY_WITH_PRODUCTS_SELECT,
  buildCategoryTree,
  type CategoryNode,
} from "@/lib/categories";

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
