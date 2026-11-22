/**
 * Product search that runs in the browser.
 *
 * The catalogue is under a hundred products, so the whole list is matched
 * locally: results change on every keystroke with no request in between, which
 * is what makes typing on a phone feel instant. The same matcher filters
 * /shop?search=…, so the quick search and the catalogue never disagree.
 */

/** What the search overlay needs to show and add a product. */
export interface SearchProduct {
  id: string;
  slug: string;
  name: string;
  name_en: string | null;
  price: number;
  image: string | null;
  volume: string | null;
  category: string | null;
  category_en: string | null;
  in_stock: boolean;
  is_coming_soon: boolean;
  is_bestseller: boolean;
}

/** Letters people swap between Ukrainian and Russian spellings of one word. */
const FOLD: Record<string, string> = {
  і: "и",
  ы: "и",
  є: "е",
  э: "е",
  ґ: "г",
  ъ: "",
  ь: "",
};

/**
 * Lowercases and strips everything a shopper would not type the same way twice:
 * accents ("Gólov" → "golov"), apostrophes ("зв'язок"), punctuation, and the
 * и/і, е/є letter pairs, so "кондиционер" finds "кондиціонер".
 */
export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’ʼ`]/g, "")
    .replace(/[іыєэґъь]/g, (ch) => FOLD[ch] ?? ch)
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function searchTokens(query: string): string[] {
  const normalized = normalizeSearchText(query);
  return normalized ? normalized.split(" ") : [];
}

/** The text a product is matched against, already normalized. */
export function searchHaystack(parts: Array<string | null | undefined>): string {
  return normalizeSearchText(parts.filter(Boolean).join(" "));
}

/**
 * 0 when some word of the query is missing from the product. Otherwise higher
 * is better: a query word that starts a word of the product ("шамп" → "шампунь")
 * counts for more than one found in the middle ("пун").
 */
export function matchScore(haystack: string, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const words = haystack.split(" ");
  let score = 0;
  for (const token of tokens) {
    if (!haystack.includes(token)) return 0;
    score += words.some((w) => w.startsWith(token)) ? 3 : 1;
  }
  return score;
}

/** True when every word of the query is found in the given texts. */
export function matchesSearch(
  parts: Array<string | null | undefined>,
  query: string,
): boolean {
  const tokens = searchTokens(query);
  if (tokens.length === 0) return true;
  return matchScore(searchHaystack(parts), tokens) > 0;
}

export interface SearchEntry {
  product: SearchProduct;
  haystack: string;
}

export function buildSearchIndex(products: SearchProduct[]): SearchEntry[] {
  return products.map((product) => ({
    product,
    haystack: searchHaystack([
      product.name,
      product.name_en,
      product.category,
      product.category_en,
      product.volume,
    ]),
  }));
}

export const MIN_SEARCH_LENGTH = 2;

/**
 * Best matches first. Among equal matches, products that can be bought come
 * before sold-out ones and bestsellers before the rest; the index order (the
 * catalogue's own "popular" order) settles what is left.
 */
export function searchProducts(index: SearchEntry[], query: string): SearchProduct[] {
  const tokens = searchTokens(query);
  if (tokens.join("").length < MIN_SEARCH_LENGTH) return [];

  return index
    .map((entry, position) => {
      const base = matchScore(entry.haystack, tokens);
      if (base === 0) return null;
      const { product } = entry;
      const available = product.in_stock && !product.is_coming_soon;
      return {
        product,
        position,
        score: base + (available ? 0.5 : 0) + (product.is_bestseller ? 0.25 : 0),
      };
    })
    .filter((hit): hit is NonNullable<typeof hit> => hit !== null)
    .sort((a, b) => b.score - a.score || a.position - b.position)
    .map((hit) => hit.product);
}
