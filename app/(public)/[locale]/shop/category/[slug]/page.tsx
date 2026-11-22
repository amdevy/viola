import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/server";
import ProductCard from "@/components/shop/ProductCard";
import ProductListGA from "@/components/shop/ProductListGA";
import CollapsibleIntro from "@/components/ui/CollapsibleIntro";
import { localize, PRODUCT_I18N_FIELDS, CATEGORY_I18N_FIELDS } from "@/lib/i18n/localize";
import { getCategorySeo } from "@/lib/category-seo";
import { getCategoryContext } from "@/lib/categories-server";
import { getProductsByCategoryIds } from "@/lib/products-server";
import {
  CATEGORY_WITH_PRODUCTS_SELECT,
  buildCategoryTree,
  flattenCategoryTree,
} from "@/lib/categories";
import { getBrandLine, categoryHeading, categoryIntro } from "@/lib/category-brand";
import { getCategoryFacts, categoryFactsLine, categoryPriceFaq } from "@/lib/category-facts";
import { categoryTitle, categoryDescription, pageTitle } from "@/lib/seo-title";
import type { Category, Product } from "@/types";
import type { Metadata } from "next";
import { safeJsonLd } from "@/lib/utils";
import { markdownAlternate } from "@/lib/md/format";

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const ctx = await getCategoryContext(slug);
  if (!ctx) return { title: pageTitle(locale === "en" ? "Category not found" : "Категорію не знайдено"), robots: { index: false, follow: true } };

  const { row: category } = localize(
    ctx.category as unknown as Record<string, unknown>,
    locale,
    CATEGORY_I18N_FIELDS,
  ) as unknown as { row: Category };

  const products = await getProductsByCategoryIds(ctx.listingIds);
  const isEmpty = products.length === 0;

  const brand = getBrandLine(ctx.rootSlug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";
  const ukUrl = `${siteUrl}/shop/category/${slug}`;
  const enUrl = `${siteUrl}/en/shop/category/${slug}`;

  const meta = { slug, name: category.name, locale, brand };
  const title = categoryTitle(meta);
  const description = categoryDescription(meta);

  return {
    title,
    description,
    keywords: locale === "en" ? [
      category.name,
      `${category.name} ${brand.latinPlain}`,
      `buy ${category.name}`,
      `${brand.latinPlain} ${category.name}`,
      ...brand.keywordsEn,
    ] : [
      category.name,
      `${category.name} ${brand.latinPlain}`,
      `${category.name} ${brand.uk}`,
      `${category.name} купити`,
      `купити ${category.name}`,
      `${category.name} купити Україна`,
      `${brand.uk} ${category.name}`,
      `${brand.ukLower} ${category.name.toLowerCase()}`,
      ...brand.keywordsUk,
    ],
    alternates: {
      // The markdown version exists only where this page is indexable.
      ...(!isEmpty && { types: markdownAlternate(`/shop/category/${slug}`, locale) }),
      canonical: locale === "en" ? enUrl : ukUrl,
      languages: { uk: ukUrl, en: enUrl, "x-default": ukUrl },
    },
    openGraph: {
      title,
      description,
      locale: locale === "en" ? "en_US" : "uk_UA",
      images: [{ url: "/preview.jpg", width: 1200, height: 630 }],
    },
    robots: isEmpty
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const tc = await getTranslations({ locale, namespace: "common" });
  const ts = await getTranslations({ locale, namespace: "shop" });

  const ctx = await getCategoryContext(slug);
  if (!ctx) notFound();

  const localizeCategory = (c: Category) =>
    (
      localize(
        c as unknown as Record<string, unknown>,
        locale,
        CATEGORY_I18N_FIELDS,
      ) as unknown as { row: Category }
    ).row;

  const category = localizeCategory(ctx.category);
  const parent = ctx.parent ? localizeCategory(ctx.parent) : null;
  const children = ctx.children.map(localizeCategory);
  const brand = getBrandLine(ctx.rootSlug);

  const productsRaw = await getProductsByCategoryIds(ctx.listingIds);

  // Порожню категорію не показуємо — див. lib/categories.ts
  if (productsRaw.length === 0) notFound();

  const products = productsRaw.map((p) => {
    const { row } = localize(
      p as unknown as Record<string, unknown>,
      locale,
      PRODUCT_I18N_FIELDS,
    ) as unknown as { row: Product };
    if (row.category) {
      const { row: cat } = localize(
        row.category as unknown as Record<string, unknown>,
        locale,
        CATEGORY_I18N_FIELDS,
      ) as unknown as { row: typeof row.category };
      row.category = cat;
    }
    return row;
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";

  const localePrefix = locale === "en" ? "/en" : "";

  // The parent level is the whole SEO point of the hierarchy: it is what tells
  // Google (and the SERP breadcrumb strip) that "Гелі для душу" sits under
  // "Догляд за шкірою", without nesting the URL.
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tc("home"), item: locale === "en" ? `${siteUrl}/en` : siteUrl },
      { "@type": "ListItem", position: 2, name: ts("breadcrumbShop"), item: `${siteUrl}${localePrefix}/shop` },
      ...(parent
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: parent.name,
              item: `${siteUrl}${localePrefix}/shop/category/${parent.slug}`,
            },
          ]
        : []),
      { "@type": "ListItem", position: parent ? 4 : 3, name: category.name },
    ],
  };

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: category.name,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${siteUrl}${locale === "en" ? "/en" : ""}/shop/${p.slug}`,
      name: p.name,
    })),
  };

  const seo = getCategorySeo(slug, locale);

  // Count, price range and stock, straight from the products on this page.
  const facts = getCategoryFacts(products);
  const factsInput = facts && { slug, name: category.name, locale, brand, facts };

  // The price question is generated, so a category without hand-written copy
  // (peeling shampoos, the skin line) still gets an FAQ, and no price in an
  // answer can drift away from the price on the card.
  const faq = [...(seo?.faq ?? []), ...(factsInput ? [categoryPriceFaq(factsInput)] : [])];

  const faqLd =
    faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

  const introText = categoryIntro(category.name, brand, locale);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }} />
      {products.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListLd) }} />
      )}
      {faqLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqLd) }} />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8">
        <nav className="text-xs text-[#6B6B6B] mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-[#C4A882]">{tc("home")}</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-[#C4A882]">{ts("breadcrumbShop")}</Link>
          {parent && (
            <>
              <span>/</span>
              <Link
                href={`/shop/category/${parent.slug}`}
                className="hover:text-[#C4A882]"
              >
                {parent.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-[#1A1A1A]">{category.name}</span>
        </nav>

        <header className="mb-6 md:mb-10 max-w-3xl">
          <p className="text-[#C4A882] text-xs uppercase tracking-[0.3em] mb-3">{brand.eyebrow}</p>
          {/* У H1 бренд без наголосу і дужок: "na golovy шампунь" — 2 275
              показів за квартал, а "Gólov[y]" на цей запит не матчиться. */}
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A1A1A] mb-4 leading-tight">
            {categoryHeading(category.name, brand, locale)}
          </h1>
          <CollapsibleIntro
            moreLabel={tc("readMore")}
            lessLabel={tc("showLess")}
            analyticsId={category.slug}
          >
            <p className="text-[#6B6B6B] leading-relaxed">{introText}</p>
            {factsInput && (
              <p className="mt-3 text-sm font-medium text-[#1A1A1A]">
                {categoryFactsLine(factsInput)}
              </p>
            )}
          </CollapsibleIntro>
        </header>

        {/* Children as real crawlable links, above the grid. Gives the parent an
            internal-linking role beyond the product list and lets a shopper
            narrow down instead of scrolling a merged catalogue. */}
        {children.length > 0 && (
          <nav className="mb-8 flex flex-wrap gap-2" aria-label={category.name}>
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/shop/category/${child.slug}`}
                className="px-4 py-2 text-sm rounded border border-[#E8E4DE] bg-white text-[#1A1A1A] hover:border-[#C4A882] hover:text-[#C4A882] transition-colors"
              >
                {child.name}
              </Link>
            ))}
          </nav>
        )}

        {products.length > 0 ? (
          <>
            <ProductListGA products={products} listName={`category_${category.slug}`} />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        ) : (
          <p className="text-[#6B6B6B] text-center py-16">
            {locale === "en" ? "No products in this category yet." : "У цій категорії поки немає товарів."}
          </p>
        )}

        {/* Long-form SEO content: technologist guidance + FAQ */}
        {(seo || faq.length > 0) && (
          <section className="mt-16 pt-12 border-t border-[#E8E4DE] max-w-3xl">
            {seo && (
              <div className="space-y-10 mb-12">
                {seo.sections.map((s) => (
                  <div key={s.heading}>
                    <h2 className="font-serif text-2xl font-semibold text-[#1A1A1A] mb-4">
                      {s.heading}
                    </h2>
                    <div className="space-y-3">
                      {s.body.map((p, i) => (
                        <p key={i} className="text-[#6B6B6B] leading-relaxed">
                          {p}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {faq.length > 0 && (
              <div>
                <h2 className="font-serif text-2xl font-semibold text-[#1A1A1A] mb-6">
                  {locale === "en" ? "Frequently asked questions" : "Часті запитання"}
                </h2>
                <div className="space-y-6">
                  {faq.map((f) => (
                    <div key={f.q} className="border-b border-[#E8E4DE] pb-6">
                      <h3 className="font-medium text-[#1A1A1A] mb-2">{f.q}</h3>
                      <p className="text-[#6B6B6B] leading-relaxed">{f.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Посилання на хаб бренду — з кожної категорії, не лише з тих, що
            мають довгий текст, і з анкором у тому написанні, яким шукають. */}
        <div className="mt-10">
          <Link
            href="/na-golovy"
            className="text-sm text-[#C4A882] hover:text-[#1A1A1A] transition-colors"
          >
            {locale === "en"
              ? "Learn more about the Na Golovy brand →"
              : "Дізнатися більше про бренд На Голову (Na Golovy) →"}
          </Link>
        </div>

        {/* Internal linking: other categories */}
        <aside className="mt-16 pt-12 border-t border-[#E8E4DE]">
          <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-6">
            {locale === "en" ? "Other categories" : "Інші категорії"}
          </h2>
          <OtherCategoriesList currentSlug={slug} locale={locale} />
        </aside>
      </div>
    </>
  );
}

async function OtherCategoriesList({
  currentSlug,
  locale,
}: {
  currentSlug: string;
  locale: string;
}) {
  const supabase = createPublicClient();
  const { data } = await supabase.from("categories").select(CATEGORY_WITH_PRODUCTS_SELECT);

  const categories = flattenCategoryTree(buildCategoryTree(data))
    .filter((c) => c.slug !== currentSlug)
    .map((c) => {
      const { row } = localize(
        c as unknown as Record<string, unknown>,
        locale,
        CATEGORY_I18N_FIELDS,
      ) as unknown as { row: Category };
      return row;
    });

  return (
    <div className="flex flex-wrap gap-3">
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/shop/category/${c.slug}`}
          className="text-sm border border-[#E8E4DE] px-4 py-2 rounded hover:border-[#C4A882] hover:text-[#C4A882] transition-colors"
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}
