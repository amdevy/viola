import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/server";
import ProductCard from "@/components/shop/ProductCard";
import ProductListGA from "@/components/shop/ProductListGA";
import { localize, PRODUCT_I18N_FIELDS, CATEGORY_I18N_FIELDS } from "@/lib/i18n/localize";
import { getCategorySeo } from "@/lib/category-seo";
import {
  CATEGORY_WITH_PRODUCTS_SELECT,
  buildCategoryTree,
  flattenCategoryTree,
} from "@/lib/categories";
import { getBrandLine } from "@/lib/category-brand";
import type { Category, Product } from "@/types";
import type { Metadata } from "next";
import { safeJsonLd } from "@/lib/utils";

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string; locale: string }>;
}

type CategoryContext = {
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
async function getCategoryContext(slug: string): Promise<CategoryContext | null> {
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

async function getProductsByCategory(categoryIds: string[]): Promise<Product[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(id,name,name_en,slug)")
    .in("category_id", categoryIds)
    .order("created_at", { ascending: false });
  return (data as Product[]) ?? [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const ctx = await getCategoryContext(slug);
  if (!ctx) return { title: locale === "en" ? "Category not found" : "Категорію не знайдено" };

  const { row: category } = localize(
    ctx.category as unknown as Record<string, unknown>,
    locale,
    CATEGORY_I18N_FIELDS,
  ) as unknown as { row: Category };

  const products = await getProductsByCategory(ctx.listingIds);
  const isEmpty = products.length === 0;

  const brand = getBrandLine(ctx.rootSlug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";
  const ukUrl = `${siteUrl}/shop/category/${slug}`;
  const enUrl = `${siteUrl}/en/shop/category/${slug}`;

  const title =
    locale === "en"
      ? `${category.name} ${brand.latin} — Buy in Ukraine`
      : `${category.name} ${brand.uk} (${brand.latin}) — Купити в Україні`;

  const description =
    locale === "en"
      ? `Buy ${category.name.toLowerCase()} ${brand.latin} (${brand.uk}) online. Professional Ukrainian ${brand.subjectEn} cosmetics with Nova Poshta delivery across Ukraine.`
      : `Купити ${category.name.toLowerCase()} ${brand.uk} (${brand.latin}) онлайн в Україні. Професійна українська аромакосметика ${brand.subjectUk} з доставкою Новою Поштою.`;

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

  const productsRaw = await getProductsByCategory(ctx.listingIds);

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

  const faqLd = seo
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: seo.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;

  const introText =
    locale === "en"
      ? `Professional ${brand.latin} ${category.name.toLowerCase()} — niche aromatic ${brand.subjectEn} cosmetics from Ukrainian brand. High concentration of active ingredients, ${brand.benefitEn}and full range combinability. Sold exclusively through accredited brand technologists.`
      : `Професійні ${category.name.toLowerCase()} ${brand.latin} — нішева аромакосметика ${brand.subjectUk} від українського бренду. Висока концентрація активних компонентів, ${brand.benefitUk}повна сумісність між лінійками. Продається виключно через акредитованих технологів бренду.`;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }} />
      {products.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListLd) }} />
      )}
      {faqLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqLd) }} />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <header className="mb-10 max-w-3xl">
          <p className="text-[#C4A882] text-xs uppercase tracking-[0.3em] mb-3">{brand.eyebrow}</p>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A1A1A] mb-4 leading-tight">
            {locale === "en"
              ? `${category.name} ${brand.latin} — Buy in Ukraine`
              : `${category.name} ${brand.uk} (${brand.latin}) — Купити в Україні`}
          </h1>
          <p className="text-[#6B6B6B] leading-relaxed">{introText}</p>
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
        {seo && (
          <section className="mt-16 pt-12 border-t border-[#E8E4DE] max-w-3xl">
            <div className="space-y-10">
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

            <div className="mt-12">
              <h2 className="font-serif text-2xl font-semibold text-[#1A1A1A] mb-6">
                {locale === "en" ? "Frequently asked questions" : "Часті запитання"}
              </h2>
              <div className="space-y-6">
                {seo.faq.map((f) => (
                  <div key={f.q} className="border-b border-[#E8E4DE] pb-6">
                    <h3 className="font-medium text-[#1A1A1A] mb-2">{f.q}</h3>
                    <p className="text-[#6B6B6B] leading-relaxed">{f.a}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10">
              <Link
                href="/na-golovy"
                className="text-sm text-[#C4A882] hover:text-[#1A1A1A] transition-colors"
              >
                {locale === "en"
                  ? "Learn more about the Na Gólov[y] brand →"
                  : "Дізнатися більше про бренд Na Gólov[y] →"}
              </Link>
            </div>
          </section>
        )}

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
