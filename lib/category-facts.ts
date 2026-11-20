/**
 * Facts about a category that are computed from its products, not written by
 * hand: how many there are, what they cost, how many can be bought today.
 *
 * Why they are on the page. Search Console, Aug–Nov 2026: the category pages
 * sit at positions 7–9 for "на голову шампунь" and its variants, and people
 * also search "… ціна" (≈170 impressions a quarter). The titles promise
 * "купити, ціна", but no sentence on the page said what the price is — the only
 * prices were inside the product cards. The resellers that rank above state the
 * range in plain text, and that sentence is what Google's AI overview quoted.
 *
 * The same numbers label the links from /shop and from product pages, so the
 * anchor that points at a category says what is behind it.
 */

import type { BrandLine } from "@/lib/category-brand";
import { categoryNoun } from "@/lib/seo-title";
import { formatPrice } from "@/lib/utils";

export type CategoryFacts = {
  /** Every product listed on the page. */
  count: number;
  /** Of those, how many are in stock. */
  inStock: number;
  /** Price range of what can be bought now; of everything if nothing is in stock. */
  minPrice: number;
  maxPrice: number;
};

type PricedProduct = { price: number | string; in_stock: boolean };

export function getCategoryFacts(products: PricedProduct[]): CategoryFacts | null {
  const priced = products
    .map((p) => ({ price: Number(p.price), inStock: p.in_stock }))
    .filter((p) => Number.isFinite(p.price) && p.price > 0);
  if (priced.length === 0) return null;

  const available = priced.filter((p) => p.inStock);
  // A price nobody can pay today is not "from": the cheapest leave-in product
  // was out of stock, and quoting it would have promised 1 200 for 1 750.
  const prices = (available.length > 0 ? available : priced).map((p) => p.price);

  return {
    count: products.length,
    inStock: available.length,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
  };
}

/** "19 товарів", "1 товар", "3 товари" — the number with its noun. */
export function productCountText(count: number, locale: string): string {
  if (locale === "en") return `${count} ${count === 1 ? "product" : "products"}`;
  const mod10 = count % 10;
  const mod100 = count % 100;
  const noun =
    mod10 === 1 && mod100 !== 11
      ? "товар"
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? "товари"
        : "товарів";
  return `${count} ${noun}`;
}

/** The amount without its currency: "2 650" from "2 650 грн". */
function amount(price: number, locale: string): string {
  return formatPrice(price, locale).replace(/\s*(грн|UAH)$/, "");
}

/** "від 900 до 2 650 грн", or just "1 500 грн" when everything costs the same. */
export function priceRangeText(facts: CategoryFacts, locale: string): string {
  if (facts.minPrice === facts.maxPrice) return formatPrice(facts.minPrice, locale);
  return locale === "en"
    ? `from ${amount(facts.minPrice, locale)} to ${formatPrice(facts.maxPrice, locale)}`
    : `від ${amount(facts.minPrice, locale)} до ${formatPrice(facts.maxPrice, locale)}`;
}

/** "від 900 грн" — the short form for a link label. */
export function priceFromText(facts: CategoryFacts, locale: string): string {
  if (facts.minPrice === facts.maxPrice) return formatPrice(facts.minPrice, locale);
  return locale === "en"
    ? `from ${formatPrice(facts.minPrice, locale)}`
    : `від ${formatPrice(facts.minPrice, locale)}`;
}

type BrandNames = Pick<BrandLine, "uk" | "latinPlain">;

/**
 * Anchor text for a link to a category: the category AND the brand, because
 * that pair is the query ("шампуні на голову"). The menu and the breadcrumbs
 * say only "Шампуні", so before this no internal link carried both words.
 */
export function categoryLinkLabel(name: string, brand: BrandNames, locale: string): string {
  return locale === "en" ? `${brand.latinPlain} ${name}` : `${name} ${brand.uk}`;
}

type FactsInput = {
  slug: string;
  /** Localised category name, as shown in the H1. */
  name: string;
  locale: string;
  brand: BrandNames;
  facts: CategoryFacts;
};

/** One sentence under the category intro: count, price range, availability. */
export function categoryFactsLine({ name, locale, brand, facts }: Omit<FactsInput, "slug">): string {
  const count = productCountText(facts.count, locale);
  const range = priceRangeText(facts, locale);

  if (locale === "en") {
    const stock =
      facts.inStock === 0 ? "" : facts.inStock === facts.count ? ", all in stock" : `, ${facts.inStock} in stock`;
    return `${brand.latinPlain} ${name} at Viola: ${count}, priced ${range}${stock}.`;
  }

  const stock =
    facts.inStock === 0 ? "" : facts.inStock === facts.count ? ", усі в наявності" : `, ${facts.inStock} в наявності`;
  return `${name} ${brand.uk} (${brand.latinPlain}) у Viola: ${count}, ціна ${range}${stock}.`;
}

/**
 * The price question for the category FAQ. Built from the live prices, so it
 * cannot go stale the way a hand-written "від 900 грн" would.
 */
export function categoryPriceFaq({ slug, name, locale, brand, facts }: FactsInput): { q: string; a: string } {
  const range = priceRangeText(facts, locale);
  const same = facts.minPrice === facts.maxPrice;
  const noun = categoryNoun(slug, locale);

  if (locale === "en") {
    const subject = `${brand.latinPlain} ${name.toLowerCase()}`;
    return {
      q: `What are the prices for ${subject}?`,
      a: same
        ? `Every product in ${subject} at Viola costs ${range}. The current price is shown on each product card on this page.`
        : `Prices for ${subject} at Viola range ${range}, depending on the product and the bottle size. The current price is shown on each product card on this page.`,
    };
  }

  return {
    q: noun
      ? `Скільки коштує ${noun.toLowerCase()} ${brand.uk}?`
      : `Які ціни на ${name.toLowerCase()} ${brand.uk}?`,
    a: same
      ? `Усі засоби в категорії «${name}» ${brand.uk} (${brand.latinPlain}) у Viola коштують ${range}. Актуальна ціна вказана в картці кожного товару на цій сторінці.`
      : `Ціна в категорії «${name}» ${brand.uk} (${brand.latinPlain}) у Viola — ${range}, залежно від засобу та об'єму флакона. Актуальна ціна вказана в картці кожного товару на цій сторінці.`,
  };
}
