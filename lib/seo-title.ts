/**
 * Page titles and descriptions that Search Console showed were costing clicks.
 *
 * Three things went wrong at once, and they are all fixed here rather than in
 * each page:
 *
 * 1. The root layout had `title.template = "%s — Na Gólov[y] | Viola"`, and
 *    most pages already put the brand in their own title. Result: "… | Viola —
 *    Na Gólov[y] | Viola", 80+ characters, cut off in the SERP. Next also
 *    applies the template unevenly (not to the page in the layout's own
 *    segment, not to the nested dynamic ones), so half the site had a suffix
 *    and half did not. Now no template: every page builds its full title
 *    through `pageTitle()` and gets exactly one " | Viola".
 *
 * 2. Titles wrote the brand only as the stylised "Na Gólov[y]". People type
 *    "na golovy" (7 000 impressions a quarter, CTR 1.2%) — the accent and the
 *    brackets break the exact match. Titles use the plain spelling; the
 *    stylised one stays in the body copy.
 *
 * 3. Category titles used the plural category name ("Шампуні"), while the
 *    query is singular: "на голову шампунь" — 4 300 impressions, vs 66 for
 *    "шампуні на голову". `CATEGORY_NOUN` carries the singular for the hair
 *    categories; anything else falls back to the category name.
 */

import type { BrandLine } from "@/lib/category-brand";

export const SITE_NAME = "Viola";

/**
 * Soft ceiling. Google cuts titles at ~600px; for Cyrillic text that is
 * 60–62 characters, so the longest category ("Незмивний догляд …") still fits.
 */
export const TITLE_MAX_LENGTH = 62;

/** Appends " | Viola" exactly once. */
export function pageTitle(base: string): string {
  const trimmed = base.trim();
  return trimmed.endsWith(`| ${SITE_NAME}`) ? trimmed : `${trimmed} | ${SITE_NAME}`;
}

type LocaleText = { uk: string; en: string };

const CATEGORY_NOUN: Record<string, LocaleText> = {
  shampoos: { uk: "Шампунь", en: "Shampoo" },
  conditioners: { uk: "Кондиціонер", en: "Conditioner" },
  masks: { uk: "Маска", en: "Hair Mask" },
  "leave-in": { uk: "Незмивний догляд", en: "Leave-in Care" },
  "peeling-shampoos": { uk: "Пілінг-шампунь", en: "Peeling Shampoo" },
};

// Named products beat the generic "professional cosmetics with delivery" line:
// a searcher comparing resellers sees what is actually on the page.
const CATEGORY_DESCRIPTION: Record<string, LocaleText> = {
  shampoos: {
    uk: "Шампуні На Голову (Na Golovy) від технолога бренду Віоли Гегедош: колагенові, безсульфатні, гіалуронові, Harmony для фарбованого волосся. Доставка Новою Поштою.",
    en: "Na Golovy shampoos from brand technologist Viola Hehedosh: collagen, sulfate-free, hyaluronic, Harmony for colored hair. Nova Poshta delivery across Ukraine.",
  },
  conditioners: {
    uk: "Кондиціонери На Голову (Na Golovy): 9 протеїнів, 5 екзотичних олій, Harmony для фарбованого волосся. Консультація технолога бренду, доставка Новою Поштою.",
    en: "Na Golovy conditioners: 9 proteins, 5 exotic oils, collagen, Harmony for colored hair. Brand technologist consultation, Nova Poshta delivery across Ukraine.",
  },
  masks: {
    uk: "Маски для волосся На Голову (Na Golovy): ламінування, діамантовий блиск, поліпептидна павутинка, термомаска. Підбір від технолога бренду, доставка Новою Поштою.",
    en: "Na Golovy hair masks: lamination, diamond gloss, polypeptide web, thermal mask, 5 lipids. Chosen with the brand technologist, Nova Poshta delivery across Ukraine.",
  },
  "leave-in": {
    uk: "Незмивний догляд На Голову (Na Golovy): BB-креми, термозахист Royal Shine, Velvet Cream, флюїди Diamond Elixir. Підбір від технолога, доставка Новою Поштою.",
    en: "Na Golovy leave-in care: BB creams, Royal Shine thermal protection, Velvet Cream, Diamond Elixir fluids. Chosen with the brand technologist, Nova Poshta delivery.",
  },
  "peeling-shampoos": {
    uk: "Пілінг-шампуні На Голову (Na Golovy) для шкіри голови: гіалуроновий, SoftGrain, з вітамінним комплексом, Active Clean. Консультація технолога, доставка по Україні.",
    en: "Na Golovy scalp peeling shampoos: hyaluronic, SoftGrain cream, vitamin complex, Active Clean. Technologist consultation, delivery across Ukraine.",
  },
};

type CategoryMetaInput = {
  slug: string;
  /** Localised category name — the fallback when the slug has no entry. */
  name: string;
  locale: string;
  brand: Pick<BrandLine, "uk" | "latinPlain" | "subjectUk" | "subjectEn">;
};

function pick(text: LocaleText | undefined, locale: string): string | undefined {
  if (!text) return undefined;
  return locale === "en" ? text.en : text.uk;
}

export function categoryTitle({ slug, name, locale, brand }: CategoryMetaInput): string {
  const noun = pick(CATEGORY_NOUN[slug], locale) ?? name;
  return locale === "en"
    ? pageTitle(`${noun} ${brand.latinPlain} — Buy in Ukraine`)
    : pageTitle(`${noun} ${brand.uk} (${brand.latinPlain}) — купити, ціна`);
}

export function categoryDescription({ slug, name, locale, brand }: CategoryMetaInput): string {
  const specific = pick(CATEGORY_DESCRIPTION[slug], locale);
  if (specific) return specific;
  return locale === "en"
    ? `Buy ${name.toLowerCase()} ${brand.latinPlain} (${brand.uk}) online. Professional Ukrainian ${brand.subjectEn} cosmetics with Nova Poshta delivery across Ukraine.`
    : `Купити ${name.toLowerCase()} ${brand.uk} (${brand.latinPlain}) онлайн в Україні. Професійна українська аромакосметика ${brand.subjectUk} з доставкою Новою Поштою.`;
}

export function productTitle(name: string, locale: string): string {
  return locale === "en"
    ? pageTitle(`${name} — Buy Na Golovy`)
    : pageTitle(`${name} — купити На Голову (Na Golovy)`);
}
