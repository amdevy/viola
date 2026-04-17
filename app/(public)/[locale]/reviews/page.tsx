import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { createPublicClient } from "@/lib/supabase/server";
import ReviewsList from "./ReviewsList";
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
  const ukUrl = `${siteUrl}/reviews`;
  const enUrl = `${siteUrl}/en/reviews`;

  return {
    title: t("reviewsTitle"),
    description: t("reviewsDescription"),
    keywords: ["відгуки Na Golovy", "na golovy відгуки", "на голову відгуки", "Na Golovy відгуки покупців"],
    alternates: {
      canonical: locale === "en" ? enUrl : ukUrl,
      languages: { uk: ukUrl, en: enUrl, "x-default": ukUrl },
    },
  };
}

export interface Review {
  id: string;
  author_name: string;
  rating: number;
  text: string;
  product_id: string | null;
  product?: { name: string; slug: string } | null;
  created_at: string;
  approved: boolean;
}

async function getReviews(): Promise<Review[]> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("reviews")
      .select("*, product:products(name, slug)")
      .eq("approved", true)
      .order("created_at", { ascending: false });
    return (data as Review[]) ?? [];
  } catch {
    return [];
  }
}

export default async function ReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "reviews" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const ts = await getTranslations({ locale, namespace: "schema" });
  const reviews = await getReviews();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tc("home"), item: locale === "en" ? `${siteUrl}/en` : siteUrl },
      { "@type": "ListItem", position: 2, name: t("title") },
    ],
  };

  const aggregateRd = reviews.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://violamukachevo.com/#business",
    name: ts("salonName"),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: avgRating,
      reviewCount: reviews.length,
      bestRating: "5",
      worstRating: "1",
    },
  } : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {aggregateRd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateRd) }}
        />
      )}

      {/* Breadcrumb */}
      <nav className="text-xs text-[#6B6B6B] mb-8">
        <Link href="/" className="hover:text-[#C4A882]">{tc("home")}</Link>
        <span className="mx-2">/</span>
        <span className="text-[#1A1A1A]">{t("title")}</span>
      </nav>

      <div className="text-center mb-12">
        <h1 className="font-serif text-4xl font-bold text-[#1A1A1A] mb-3">{t("title")}</h1>
        <p className="text-[#6B6B6B] max-w-xl mx-auto">
          {t("subtitle")}
        </p>
      </div>

      <ReviewsList initialReviews={reviews} />
    </div>
  );
}
