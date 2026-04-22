import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/server";
import ProductCard from "@/components/shop/ProductCard";
import { localize, PRODUCT_I18N_FIELDS, CATEGORY_I18N_FIELDS } from "@/lib/i18n/localize";
import type { Category, Product } from "@/types";
import type { Metadata } from "next";

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string; locale: string }>;
}

async function getCategory(slug: string): Promise<Category | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();
  return (data as Category) ?? null;
}

async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(id,name,name_en,slug)")
    .eq("category_id", categoryId)
    .eq("in_stock", true)
    .order("created_at", { ascending: false });
  return (data as Product[]) ?? [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const raw = await getCategory(slug);
  if (!raw) return { title: locale === "en" ? "Category not found" : "Категорію не знайдено" };

  const { row: category } = localize(
    raw as unknown as Record<string, unknown>,
    locale,
    CATEGORY_I18N_FIELDS,
  ) as unknown as { row: Category };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";
  const ukUrl = `${siteUrl}/shop/category/${slug}`;
  const enUrl = `${siteUrl}/en/shop/category/${slug}`;

  const title =
    locale === "en"
      ? `${category.name} Na Gólov[y] — Buy in Ukraine`
      : `${category.name} На Голову (Na Gólov[y]) — Купити в Україні`;

  const description =
    locale === "en"
      ? `Buy ${category.name.toLowerCase()} Na Gólov[y] (На Голову) online. Professional Ukrainian hair cosmetics with Nova Poshta delivery across Ukraine.`
      : `Купити ${category.name.toLowerCase()} На Голову (Na Gólov[y]) онлайн в Україні. Професійна українська аромакосметика для волосся з доставкою Новою Поштою.`;

  return {
    title,
    description,
    keywords: locale === "en" ? [
      category.name,
      `${category.name} Na Golovy`,
      `buy ${category.name}`,
      `Na Golovy ${category.name}`,
      "Na Golovy",
      "Na Gólov[y]",
      "Ukrainian hair cosmetics",
      "professional hair care",
    ] : [
      category.name,
      `${category.name} Na Golovy`,
      `${category.name} На Голову`,
      `${category.name} купити`,
      `купити ${category.name}`,
      `${category.name} купити Україна`,
      `На Голову ${category.name}`,
      `на голову ${category.name.toLowerCase()}`,
      "Na Golovy",
      "Na Gólov[y]",
      "на голову",
      "На Голову",
      "na golovy купити",
      "на голову купити",
      "професійна косметика для волосся",
      "українська косметика для волосся",
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
    robots: { index: true, follow: true },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const tc = await getTranslations({ locale, namespace: "common" });
  const ts = await getTranslations({ locale, namespace: "shop" });

  const raw = await getCategory(slug);
  if (!raw) notFound();

  const { row: category } = localize(
    raw as unknown as Record<string, unknown>,
    locale,
    CATEGORY_I18N_FIELDS,
  ) as unknown as { row: Category };

  const productsRaw = await getProductsByCategory(category.id);

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

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tc("home"), item: locale === "en" ? `${siteUrl}/en` : siteUrl },
      { "@type": "ListItem", position: 2, name: ts("breadcrumbShop"), item: locale === "en" ? `${siteUrl}/en/shop` : `${siteUrl}/shop` },
      { "@type": "ListItem", position: 3, name: category.name },
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

  const introText =
    locale === "en"
      ? `Professional Na Gólov[y] ${category.name.toLowerCase()} — niche aromatic hair cosmetics from Ukrainian brand. High concentration of active ingredients, color protection, and full range combinability. Sold exclusively through accredited brand technologists.`
      : `Професійні ${category.name.toLowerCase()} Na Gólov[y] — нішева аромакосметика для волосся від українського бренду. Висока концентрація активних компонентів, захист кольору, повна сумісність між лінійками. Продається виключно через акредитованих технологів бренду.`;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {products.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="text-xs text-[#6B6B6B] mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-[#C4A882]">{tc("home")}</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-[#C4A882]">{ts("breadcrumbShop")}</Link>
          <span>/</span>
          <span className="text-[#1A1A1A]">{category.name}</span>
        </nav>

        <header className="mb-10 max-w-3xl">
          <p className="text-[#C4A882] text-xs uppercase tracking-[0.3em] mb-3">Na Gólov[y]</p>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A1A1A] mb-4 leading-tight">
            {locale === "en"
              ? `${category.name} Na Gólov[y] — Buy in Ukraine`
              : `${category.name} На Голову (Na Gólov[y]) — Купити в Україні`}
          </h1>
          <p className="text-[#6B6B6B] leading-relaxed">{introText}</p>
        </header>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="text-[#6B6B6B] text-center py-16">
            {locale === "en" ? "No products in this category yet." : "У цій категорії поки немає товарів."}
          </p>
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
  const { data } = await supabase
    .from("categories")
    .select("*")
    .neq("slug", currentSlug);

  const categories = ((data ?? []) as Category[]).map((c) => {
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
