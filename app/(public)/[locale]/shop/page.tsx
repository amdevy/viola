import { getTranslations, setRequestLocale } from "next-intl/server";
import { createPublicClient } from "@/lib/supabase/server";
import { fetchProducts } from "@/lib/products";
import ShopContent from "./ShopContent";
import type { Metadata } from "next";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";
  const ukUrl = `${siteUrl}/shop`;
  const enUrl = `${siteUrl}/en/shop`;

  return {
    title: t("shopTitle"),
    description: t("shopDescription"),
    keywords: locale === "en" ? [
      "Na Golovy",
      "Na Gólov[y]",
      "na golovy shampoo",
      "na golovy conditioner",
      "na golovy mask",
      "buy Na Golovy",
      "Ukrainian hair cosmetics shop",
      "professional hair cosmetics Ukraine",
    ] : [
      "Na Golovy",
      "Na Gólov[y]",
      "на голову",
      "На Голову",
      "купити Na Golovy",
      "na golovy купити",
      "на голову купити",
      "на голову косметика",
      "косметика на голову",
      "на голову шампунь",
      "на голову маска",
      "на голову кондиціонер",
      "Na Golovy шампунь",
      "Na Golovy маска",
      "Na Golovy кондиціонер",
      "Na Golovy незмивний догляд",
      "шампунь для фарбованого волосся",
      "безсульфатний шампунь купити",
      "маска для пошкодженого волосся",
      "термозахист для волосся",
      "тонік для волосся",
      "BB крем для волосся",
      "колагеновий шампунь",
      "професійна косметика для волосся купити",
      "нішева косметика для волосся",
    ],
    alternates: {
      canonical: locale === "en" ? enUrl : ukUrl,
      languages: { uk: ukUrl, en: enUrl, "x-default": ukUrl },
    },
    openGraph: {
      title: t("shopTitle"),
      description: t("shopDescription"),
      locale: locale === "en" ? "en_US" : "uk_UA",
      images: [{ url: "/preview.jpg", width: 1200, height: 630 }],
    },
  };
}

/**
 * The unfiltered catalogue, rendered into the HTML. It used to be fetched only
 * in the browser, so crawlers got /shop as an H1 and an intro with no products.
 */
async function getInitialProducts(locale: string) {
  const { products, error } = await fetchProducts(createPublicClient(), undefined, locale);
  if (error) {
    // Fall back to the client fetching the list itself, rather than caching an
    // empty shop until the next revalidation.
    console.error("ShopPage: product fetch failed", error);
    return null;
  }
  return products;
}

export default async function ShopPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "shop" });
  const initialProducts = await getInitialProducts(locale);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-3">
          {t("title")}
        </h1>
        <p className="text-[#6B6B6B] max-w-2xl leading-relaxed">
          {t("description")}
        </p>
      </div>

      <ShopContent initialProducts={initialProducts} />
    </div>
  );
}
