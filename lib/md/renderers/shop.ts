import { getTranslations } from "next-intl/server";
import { fetchProducts } from "@/lib/products";
import { getProductBySlug, getProductsByCategoryIds } from "@/lib/products-server";
import { getCategoryContext, getCategoryTree } from "@/lib/categories-server";
import { flattenCategoryTree } from "@/lib/categories";
import { getBrandLine, categoryHeading, categoryIntro } from "@/lib/category-brand";
import { getCategorySeo } from "@/lib/category-seo";
import { getCategoryFacts, categoryFactsLine, categoryPriceFaq } from "@/lib/category-facts";
import { categoryDescription } from "@/lib/seo-title";
import { localize, PRODUCT_I18N_FIELDS, CATEGORY_I18N_FIELDS } from "@/lib/i18n/localize";
import { createPublicClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";
import { formatPrice, formatVolume, HAIR_TYPES } from "@/lib/utils";
import { factsTable, htmlUrl, link, list, renderMdPage } from "@/lib/md/format";
import type { MdLocale } from "@/lib/md/routes";
import type { Category, Product } from "@/types";

const LABELS = {
  uk: {
    brand: "Бренд",
    category: "Категорія",
    volume: "Об'єм",
    price: "Ціна",
    oldPrice: "Стара ціна",
    availability: "Наявність",
    inStock: "В наявності",
    preorder: "Незабаром у продажу",
    other: "Інше",
    subcategories: "Підкатегорії",
    products: "Товари",
    faq: "Часті запитання",
    otherCategories: "Інші категорії",
    delivery: "Доставка та оплата",
    brandHub: "Про бренд На Голову (Na Golovy)",
  },
  en: {
    brand: "Brand",
    category: "Category",
    volume: "Volume",
    price: "Price",
    oldPrice: "Old price",
    availability: "Availability",
    inStock: "In stock",
    preorder: "Coming soon",
    other: "Other",
    subcategories: "Subcategories",
    products: "Products",
    faq: "Frequently asked questions",
    otherCategories: "Other categories",
    delivery: "Delivery & payment",
    brandHub: "About the Na Golovy brand",
  },
} as const;

/** "- [Name](url) — 520 грн · 250 мл", the one-line form every listing uses. */
function productLine(p: Product, locale: MdLocale, outOfStock: string): string {
  const facts = [formatPrice(p.price, locale), formatVolume(p.volume, locale)].filter(Boolean);
  if (!p.in_stock) facts.push(outOfStock);
  return `${link(p.name, htmlUrl(`/shop/${p.slug}`, locale))} — ${facts.join(" · ")}`;
}

function localizeCategory(c: Category, locale: MdLocale): Category {
  return (localize(c as unknown as Record<string, unknown>, locale, CATEGORY_I18N_FIELDS) as unknown as { row: Category }).row;
}

/** /shop: the whole catalogue, grouped by category, in the order the page lists it. */
export async function renderShop(locale: MdLocale): Promise<string> {
  const [t, meta, tCard] = await Promise.all([
    getTranslations({ locale, namespace: "shop" }),
    getTranslations({ locale, namespace: "meta" }),
    getTranslations({ locale, namespace: "productCard" }),
  ]);
  const L = LABELS[locale];
  const { products } = await fetchProducts(createPublicClient(), undefined, locale);

  const groups = new Map<string, { name: string; slug: string | null; items: Product[] }>();
  for (const p of products) {
    const key = p.category?.slug ?? "";
    if (!groups.has(key)) {
      groups.set(key, { name: p.category?.name ?? L.other, slug: p.category?.slug ?? null, items: [] });
    }
    groups.get(key)!.items.push(p);
  }

  const body = [
    t("description"),
    ...[...groups.values()].map((g) => {
      const heading = g.slug ? link(g.name, htmlUrl(`/shop/category/${g.slug}`, locale)) : g.name;
      return `## ${heading}\n\n${list(g.items.map((p) => productLine(p, locale, tCard("outOfStock"))))}`;
    }),
  ].join("\n\n");

  return renderMdPage(
    {
      title: t("title"),
      summary: meta("shopDescription"),
      canonical: htmlUrl("/shop", locale),
      body,
      related: [
        { text: L.brandHub, url: htmlUrl("/na-golovy", locale) },
        { text: L.delivery, url: htmlUrl("/delivery", locale) },
      ],
    },
    locale,
  );
}

/** /shop/category/[slug]. Null when the category is unknown or empty, as the page 404s. */
export async function renderCategory(slug: string, locale: MdLocale): Promise<string | null> {
  const ctx = await getCategoryContext(slug);
  if (!ctx) return null;
  const productsRaw = await getProductsByCategoryIds(ctx.listingIds);
  if (productsRaw.length === 0) return null;

  const tCard = await getTranslations({ locale, namespace: "productCard" });
  const L = LABELS[locale];
  const category = localizeCategory(ctx.category, locale);
  const children = ctx.children.map((c) => localizeCategory(c, locale));
  const brand = getBrandLine(ctx.rootSlug);
  const products = productsRaw.map(
    (p) => (localize(p as unknown as Record<string, unknown>, locale, PRODUCT_I18N_FIELDS) as unknown as { row: Product }).row,
  );
  const others = flattenCategoryTree(await getCategoryTree(locale)).filter((c) => c.slug !== slug);
  const seo = getCategorySeo(slug, locale);

  // Count, price range and stock, and the generated price question: the same
  // facts the HTML page states under its intro and at the end of its FAQ.
  const facts = getCategoryFacts(products);
  const factsInput = facts && { slug, name: category.name, locale, brand, facts };
  const faq = [...(seo?.faq ?? []), ...(factsInput ? [categoryPriceFaq(factsInput)] : [])];

  const parts = [categoryIntro(category.name, brand, locale)];
  if (factsInput) parts.push(categoryFactsLine(factsInput));
  if (children.length > 0) {
    parts.push(`## ${L.subcategories}\n\n${list(children.map((c) => link(c.name, htmlUrl(`/shop/category/${c.slug}`, locale))))}`);
  }
  parts.push(`## ${L.products}\n\n${list(products.map((p) => productLine(p, locale, tCard("outOfStock"))))}`);
  if (seo) parts.push(...seo.sections.map((s) => `## ${s.heading}\n\n${s.body.join("\n\n")}`));
  if (faq.length > 0) parts.push(`## ${L.faq}\n\n${faq.map((f) => `### ${f.q}\n\n${f.a}`).join("\n\n")}`);
  parts.push(`## ${L.otherCategories}\n\n${list(others.map((c) => link(c.name, htmlUrl(`/shop/category/${c.slug}`, locale))))}`);

  const parent = ctx.parent ? localizeCategory(ctx.parent, locale) : null;
  return renderMdPage(
    {
      title: categoryHeading(category.name, brand, locale),
      summary: categoryDescription({ slug, name: category.name, locale, brand }),
      canonical: htmlUrl(`/shop/category/${slug}`, locale),
      body: parts.join("\n\n"),
      related: [
        ...(parent ? [{ text: parent.name, url: htmlUrl(`/shop/category/${parent.slug}`, locale) }] : []),
        { text: L.brandHub, url: htmlUrl("/na-golovy", locale) },
      ],
    },
    locale,
  );
}

/** Stored text keeps single line breaks ("Спосіб використання:\nнанести…"); markdown would join them. */
function paragraphs(text: string): string {
  return text.split(/\n+/).map((l) => l.trim()).filter(Boolean).join("\n\n");
}

/** First sentence-ish of a description, cut at a word, for the summary line. */
function summarize(text: string, max = 200): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")) + "…";
}

/**
 * /shop/[slug]. Null when the product is unknown, and on /en when the English
 * translation is incomplete: that HTML page is noindex, so it gets no markdown.
 */
export async function renderProduct(slug: string, locale: MdLocale): Promise<string | null> {
  const raw = await getProductBySlug(slug);
  if (!raw) return null;

  const { row: product, hasTranslation } = localize(
    raw as unknown as Record<string, unknown>,
    locale,
    PRODUCT_I18N_FIELDS,
  ) as unknown as { row: Product; hasTranslation: boolean };
  if (locale === "en" && !hasTranslation) return null;

  const [t, tc, th, tCard] = await Promise.all([
    getTranslations({ locale, namespace: "product" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "hairTypes" }),
    getTranslations({ locale, namespace: "productCard" }),
  ]);
  const L = LABELS[locale];
  const category = product.category ? localizeCategory(product.category, locale) : null;

  const availability = product.is_coming_soon ? L.preorder : product.in_stock ? L.inStock : tCard("outOfStock");
  const hairTypes = HAIR_TYPES.filter((h) => product.hair_type?.includes(h.value)).map((h) => th(h.value));

  const parts = [
    factsTable([
      [L.brand, link("Na Gólov[y]", SITE.brandUrl)],
      [L.category, category ? link(category.name, htmlUrl(`/shop/category/${category.slug}`, locale)) : null],
      [L.volume, formatVolume(product.volume, locale)],
      [L.price, formatPrice(product.price, locale)],
      [L.oldPrice, product.compare_price ? formatPrice(product.compare_price, locale) : null],
      [L.availability, availability],
      [t("suitableFor"), hairTypes.join(", ")],
    ]),
  ];
  if (product.is_new) parts.push(`**${tc("newBadge")}**`);
  if (product.benefits?.length) parts.push(`## ${t("benefitsTitle")}\n\n${list(product.benefits)}`);
  if (product.description) parts.push(`## ${t("tabDescription")}\n\n${paragraphs(product.description)}`);
  if (product.ingredients) parts.push(`## ${t("tabIngredients")}\n\n${paragraphs(product.ingredients)}`);
  if (product.how_to_use) parts.push(`## ${t("tabHowToUse")}\n\n${paragraphs(product.how_to_use)}`);

  return renderMdPage(
    {
      title: product.name,
      summary: product.description
        ? summarize(product.description)
        : locale === "en"
          ? `${product.name} by Na Golovy, ${formatPrice(product.price, locale)}, delivered across Ukraine by Nova Poshta.`
          : `${product.name} Na Golovy (На Голову), ${formatPrice(product.price, locale)}, доставка Новою Поштою по Україні.`,
      canonical: htmlUrl(`/shop/${product.slug}`, locale),
      body: parts.join("\n\n"),
      related: [
        ...(category ? [{ text: category.name, url: htmlUrl(`/shop/category/${category.slug}`, locale) }] : []),
        { text: L.delivery, url: htmlUrl("/delivery", locale) },
        { text: L.brandHub, url: htmlUrl("/na-golovy", locale) },
      ],
    },
    locale,
  );
}
