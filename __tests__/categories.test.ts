import { describe, it, expect } from "vitest";
import {
  buildCategoryTree,
  flattenCategoryTree,
  categoryIdsForListing,
  sortCategories,
} from "@/lib/categories";

/** Shorthand for a raw row as PostgREST returns it, products array included. */
const row = (
  id: string,
  slug: string,
  opts: { parent?: string | null; products?: number; sort?: number; name?: string } = {}
) => ({
  id,
  slug,
  name: opts.name ?? slug,
  parent_id: opts.parent ?? null,
  sort_order: opts.sort ?? 99,
  created_at: "2026-01-01T00:00:00Z",
  products: Array.from({ length: opts.products ?? 0 }, (_, i) => ({ id: `${id}-p${i}` })),
});

describe("buildCategoryTree", () => {
  it("ховає категорію без товарів", () => {
    const tree = buildCategoryTree([row("1", "shampoos", { products: 3 }), row("2", "empty")]);
    expect(tree.map((c) => c.slug)).toEqual(["shampoos"]);
  });

  it("показує батька, у якого власних товарів немає, але є непорожня дитина", () => {
    // Це і є суть ієрархії: «Догляд за шкірою» ніколи не матиме власних
    // товарів, і старе правило INNER JOIN сховало б усю гілку.
    const tree = buildCategoryTree([
      row("p", "skin-care", { products: 0, sort: 20 }),
      row("c", "shower-gels", { parent: "p", products: 3, sort: 21 }),
    ]);
    expect(tree).toHaveLength(1);
    expect(tree[0].slug).toBe("skin-care");
    expect(tree[0].children.map((c) => c.slug)).toEqual(["shower-gels"]);
  });

  it("ховає батька, коли всі його діти порожні", () => {
    const tree = buildCategoryTree([
      row("p", "skin-care"),
      row("c", "shower-gels", { parent: "p", products: 0 }),
    ]);
    expect(tree).toEqual([]);
  });

  it("порожні підкатегорії не потрапляють у меню, а непорожні лишаються", () => {
    const tree = buildCategoryTree([
      row("p", "skin-care", { sort: 20 }),
      row("a", "shower-gels", { parent: "p", products: 3, sort: 21 }),
      row("b", "body-scrubs", { parent: "p", products: 0, sort: 22 }),
      row("c", "hand-creams", { parent: "p", products: 2, sort: 23 }),
    ]);
    expect(tree[0].children.map((c) => c.slug)).toEqual(["shower-gels", "hand-creams"]);
  });

  it("сортує за sort_order, а за однакового — за назвою", () => {
    const tree = buildCategoryTree([
      row("1", "masks", { products: 1, sort: 4, name: "Маски" }),
      row("2", "shampoos", { products: 1, sort: 1, name: "Шампуні" }),
      row("3", "b-cat", { products: 1, sort: 99, name: "Б" }),
      row("4", "a-cat", { products: 1, sort: 99, name: "А" }),
    ]);
    expect(tree.map((c) => c.slug)).toEqual(["shampoos", "masks", "a-cat", "b-cat"]);
  });

  it("категорія з битим parent_id не зникає, а стає кореневою", () => {
    const tree = buildCategoryTree([row("c", "orphan", { parent: "does-not-exist", products: 2 })]);
    expect(tree.map((c) => c.slug)).toEqual(["orphan"]);
  });

  it("категорія, що вказує сама на себе, не зациклює обхід", () => {
    const self = row("x", "loop", { products: 1 });
    self.parent_id = "x";
    expect(() => buildCategoryTree([self])).not.toThrow();
    expect(buildCategoryTree([self]).map((c) => c.slug)).toEqual(["loop"]);
  });

  it("порожній вхід не падає", () => {
    expect(buildCategoryTree(null)).toEqual([]);
    expect(buildCategoryTree(undefined)).toEqual([]);
    expect(buildCategoryTree([])).toEqual([]);
  });

  it("не тягне службове поле products у результат", () => {
    const tree = buildCategoryTree([row("1", "shampoos", { products: 2 })]);
    expect(tree[0]).not.toHaveProperty("products");
    expect(tree[0].productCount).toBe(2);
  });
});

describe("flattenCategoryTree", () => {
  it("повертає батьків і дітей одним списком, батько перед своїми дітьми", () => {
    const tree = buildCategoryTree([
      row("p", "skin-care", { sort: 20 }),
      row("a", "shower-gels", { parent: "p", products: 1, sort: 21 }),
      row("s", "shampoos", { products: 5, sort: 1 }),
    ]);
    expect(flattenCategoryTree(tree).map((c) => c.slug)).toEqual([
      "shampoos",
      "skin-care",
      "shower-gels",
    ]);
  });
});

describe("categoryIdsForListing", () => {
  it("сторінка батька показує товари всіх дітей, а не порожній список посилань", () => {
    const tree = buildCategoryTree([
      row("p", "skin-care"),
      row("a", "shower-gels", { parent: "p", products: 1, sort: 21 }),
      row("b", "hand-creams", { parent: "p", products: 1, sort: 22 }),
    ]);
    expect(categoryIdsForListing(tree[0])).toEqual(["p", "a", "b"]);
  });

  it("для звичайної категорії — тільки вона сама", () => {
    const tree = buildCategoryTree([row("s", "shampoos", { products: 3 })]);
    expect(categoryIdsForListing(tree[0])).toEqual(["s"]);
  });
});

describe("sortCategories", () => {
  it("категорії без sort_order опиняються в кінці", () => {
    const sorted = sortCategories([
      { slug: "new", name: "Нова" },
      { slug: "shampoos", name: "Шампуні", sort_order: 1 },
    ]);
    expect(sorted.map((c) => c.slug)).toEqual(["shampoos", "new"]);
  });
});
