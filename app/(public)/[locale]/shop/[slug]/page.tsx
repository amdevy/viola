import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/server";
import ProductGallery from "@/components/shop/ProductGallery";
import ProductCard from "@/components/shop/ProductCard";
import AddToCartButton from "./AddToCartButton";
import { formatPrice, HAIR_TYPES } from "@/lib/utils";
import { localize, PRODUCT_I18N_FIELDS, CATEGORY_I18N_FIELDS } from "@/lib/i18n/localize";
import type { Product } from "@/types";
import type { Metadata } from "next";

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string; locale: string }>;
}

async function getProduct(slug: string): Promise<Product | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(id,name,name_en,slug)")
    .eq("slug", slug)
    .single();
  return (data as Product) ?? null;
}

interface ProductReview {
  id: string;
  author_name: string;
  rating: number;
  text: string;
  created_at: string;
}

async function getProductReviews(productId: string): Promise<ProductReview[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, author_name, rating, text, created_at")
    .eq("product_id", productId)
    .eq("approved", true)
    .order("created_at", { ascending: false });
  return (data as ProductReview[]) ?? [];
}

async function getRelated(product: Product): Promise<Product[]> {
  if (!product.category_id) return [];
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(id,name,name_en,slug)")
    .eq("category_id", product.category_id)
    .neq("id", product.id)
    .eq("in_stock", true)
    .limit(4);
  return (data as Product[]) ?? [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const raw = await getProduct(slug);
  if (!raw) return { title: locale === "en" ? "Product not found" : "Товар не знайдено" };

  const { row: product, hasTranslation } = localize(
    raw as unknown as Record<string, unknown>,
    locale,
    PRODUCT_I18N_FIELDS,
  ) as unknown as { row: Product; hasTranslation: boolean };

  const title =
    locale === "en"
      ? `${product.name} — buy Na Gólov[y]`
      : `${product.name} — купити Na Gólov[y]`;
  const truncateAtWord = (text: string, max: number) => {
    if (text.length <= max) return text;
    const cut = text.slice(0, max);
    const lastSpace = cut.lastIndexOf(" ");
    return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + "…";
  };

  const description = product.description
    ? locale === "en"
      ? `${truncateAtWord(product.description, 130)} Buy Na Golovy in Ukraine.`
      : `${truncateAtWord(product.description, 130)} Купити Na Golovy в Україні.`
    : locale === "en"
      ? `Buy ${product.name} Na Golovy with Nova Poshta delivery across Ukraine. Price ${product.price} UAH.`
      : `Купити ${product.name} Na Golovy (На Голову) з доставкою Новою Поштою по Україні. Ціна ${product.price} грн.`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";
  const ukUrl = `${siteUrl}/shop/${product.slug}`;
  const enUrl = `${siteUrl}/en/shop/${product.slug}`;

  // If EN translation is incomplete, noindex the EN page to protect SEO
  const shouldNoindex = locale === "en" && !hasTranslation;

  return {
    title,
    description,
    keywords: [
      product.name, "Na Golovy", "Na Gólov[y]", "na golovy", "на голову",
      `купити ${product.name}`, "купити na golovy", "косметика для волосся Na Golovy",
    ],
    alternates: {
      canonical: locale === "en" ? enUrl : ukUrl,
      languages: {
        uk: ukUrl,
        // Only advertise EN alternate if it's fully translated
        ...(hasTranslation ? { en: enUrl } : {}),
        "x-default": ukUrl,
      },
    },
    robots: shouldNoindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      locale: locale === "en" ? "en_US" : "uk_UA",
      images: product.images?.[0]
        ? [
            {
              url: product.images[0],
              alt:
                locale === "en"
                  ? `Na Gólov[y] ${product.name} — buy in Ukraine`
                  : `Na Gólov[y] (На Голову) ${product.name} — купити в Україні`,
            },
          ]
        : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "product" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const ts = await getTranslations({ locale, namespace: "shop" });
  const th = await getTranslations({ locale, namespace: "hairTypes" });

  const raw = await getProduct(slug);
  if (!raw) notFound();

  const { row: product } = localize(
    raw as unknown as Record<string, unknown>,
    locale,
    PRODUCT_I18N_FIELDS,
  ) as unknown as { row: Product; hasTranslation: boolean };

  if (product.category) {
    const { row: localizedCategory } = localize(
      product.category as unknown as Record<string, unknown>,
      locale,
      CATEGORY_I18N_FIELDS,
    ) as unknown as { row: typeof product.category };
    product.category = localizedCategory;
  }

  const [relatedRaw, reviews] = await Promise.all([
    getRelated(product),
    getProductReviews(product.id),
  ]);

  const related = relatedRaw.map((p) => {
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

  const hairTypeLabels = HAIR_TYPES.filter((h) =>
    product.hair_type?.includes(h.value)
  ).map((h) => th(h.value as "oily" | "dry" | "normal" | "colored" | "damaged" | "curly"));

  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(product.description && { description: product.description }),
    image: product.images,
    sku: product.id,
    brand: { "@type": "Brand", name: "Na Gólov[y]", url: "https://www.nagolovy.pro/" },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "UAH",
      availability: product.in_stock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        "@id": "https://violamukachevo.com/#business",
        name: locale === "en" ? "Viola Beauty Salon" : "Салон краси Viola",
      },
      url: `${siteUrl}/shop/${product.slug}`,
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split("T")[0],
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "UA" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "UA",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        returnMethod: "https://schema.org/ReturnByMail",
      },
    },
    ...(reviews.length > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1),
        reviewCount: reviews.length,
        bestRating: "5",
        worstRating: "1",
      },
      review: reviews.slice(0, 5).map((r) => ({
        "@type": "Review",
        author: { "@type": "Person", name: r.author_name },
        datePublished: r.created_at.split("T")[0],
        reviewRating: {
          "@type": "Rating",
          ratingValue: r.rating,
          bestRating: "5",
          worstRating: "1",
        },
        reviewBody: r.text,
      })),
    }),
  };

  const breadcrumbItems: { "@type": string; position: number; name: string; item?: string }[] = [
    { "@type": "ListItem", position: 1, name: tc("home"), item: locale === "en" ? `${siteUrl}/en` : siteUrl },
    { "@type": "ListItem", position: 2, name: ts("breadcrumbShop"), item: locale === "en" ? `${siteUrl}/en/shop` : `${siteUrl}/shop` },
  ];
  if (product.category) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: product.category.name,
      item: locale === "en" ? `${siteUrl}/en/shop?category=${product.category.slug}` : `${siteUrl}/shop?category=${product.category.slug}`,
    });
  }
  breadcrumbItems.push({
    "@type": "ListItem",
    position: breadcrumbItems.length + 1,
    name: product.name,
  });

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-[#6B6B6B] mb-8 flex items-center gap-2">
          <Link href="/" className="hover:text-[#C4A882]">{tc("home")}</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-[#C4A882]">{ts("breadcrumbShop")}</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link href={`/shop?category=${product.category.slug}`} className="hover:text-[#C4A882]">
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-[#1A1A1A]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Gallery */}
          <ProductGallery images={product.images ?? []} name={product.name} />

          {/* Details */}
          <div>
            {product.category && (
              <p className="text-[#C4A882] text-xs uppercase tracking-widest mb-2">
                {product.category.name}
              </p>
            )}
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-2">
              {product.name}
            </h1>

            {product.volume && (
              <p className="text-sm text-[#6B6B6B] mb-4">{product.volume}</p>
            )}

            {/* Price */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl font-bold text-[#1A1A1A]">
                {formatPrice(product.price, locale)}
              </span>
              {product.compare_price && (
                <span className="text-base text-[#A0A0A0] line-through">
                  {formatPrice(product.compare_price, locale)}
                </span>
              )}
              {discount && (
                <span className="bg-[#C4A882] text-white text-xs font-bold px-2 py-1 rounded">
                  -{discount}%
                </span>
              )}
            </div>

            {/* Hair types */}
            {hairTypeLabels.length > 0 && (
              <div className="mb-6">
                <p className="text-xs uppercase tracking-widest text-[#6B6B6B] mb-2">
                  {t("suitableFor")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {hairTypeLabels.map((label) => (
                    <span
                      key={label}
                      className="bg-[#F0EDE8] text-[#1A1A1A] text-xs px-3 py-1.5 rounded"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Manufacturer */}
            <p className="text-sm text-[#6B6B6B] mb-6">
              {t("manufacturer")} <span className="font-semibold text-[#1A1A1A]">Na Gólov[y]</span>
            </p>

            {/* Add to cart */}
            <AddToCartButton product={product} />

            {/* Trust badges */}
            <div className="mt-6 pt-6 border-t border-[#E8E4DE] grid grid-cols-3 gap-4 text-center">
              {[
                { icon: "🚚", text: t("trustDelivery") },
                { icon: "📦", text: t("trustShipping") },
                { icon: "✓", text: t("trustOriginal") },
              ].map((b) => (
                <div key={b.text}>
                  <div className="text-lg mb-1">{b.icon}</div>
                  <p className="text-xs text-[#6B6B6B] whitespace-pre-line">{b.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-16">
          <ProductTabs product={product} t={t} />
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-8">
              {t("relatedProducts")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function ProductTabs({ product, t }: { product: Product; t: (key: string) => string }) {
  const tabs = [
    { id: "description", label: t("tabDescription"), content: product.description },
    { id: "ingredients", label: t("tabIngredients"), content: product.ingredients },
    { id: "how_to_use", label: t("tabHowToUse"), content: product.how_to_use },
  ].filter((tab) => tab.content);

  if (tabs.length === 0) return null;

  return (
    <div>
      {tabs.map((tab) => (
        <div key={tab.id} id={`tab-${tab.id}`} className="border-b border-[#E8E4DE] last:border-b-0">
          <h3 className="text-sm font-medium py-3 text-[#1A1A1A]">
            {tab.label}
          </h3>
          <div className="pb-6 prose prose-sm max-w-none">
            <p className="text-[#6B6B6B] leading-relaxed whitespace-pre-line">
              {tab.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
