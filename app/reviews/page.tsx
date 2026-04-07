import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ReviewsList from "./ReviewsList";

export const metadata: Metadata = {
  title: "Відгуки про косметику Na Golov[y] — Viola Salon",
  description: "Відгуки клієнтів салону Viola про професійну косметику для волосся Na Golovy (На Голову). Реальні враження та оцінки покупців.",
  keywords: ["відгуки Na Golovy", "na golovy відгуки", "на голову відгуки", "Na Golovy відгуки покупців"],
  alternates: { canonical: "https://violamukachevo.com/reviews" },
};

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
    const supabase = await createClient();
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

export default async function ReviewsPage() {
  const reviews = await getReviews();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Головна", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Відгуки" },
    ],
  };

  const aggregateRd = reviews.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://violamukachevo.com/#business",
    name: "Салон краси Viola",
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
        <Link href="/" className="hover:text-[#C4A882]">Головна</Link>
        <span className="mx-2">/</span>
        <span className="text-[#1A1A1A]">Відгуки</span>
      </nav>

      <div className="text-center mb-12">
        <h1 className="font-serif text-4xl font-bold text-[#1A1A1A] mb-3">Відгуки</h1>
        <p className="text-[#6B6B6B] max-w-xl mx-auto">
          Що кажуть наші клієнти про косметику Na Golov[y] та салон Viola
        </p>
      </div>

      <ReviewsList initialReviews={reviews} />
    </div>
  );
}
