import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ReviewsList from "./ReviewsList";

export const metadata: Metadata = {
  title: "Відгуки",
  description: "Відгуки наших клієнтів про косметику для волосся Viola.",
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="text-xs text-[#6B6B6B] mb-8">
        <span>Головна</span>
        <span className="mx-2">/</span>
        <span className="text-[#1A1A1A]">Відгуки</span>
      </nav>

      <div className="text-center mb-12">
        <h1 className="font-serif text-4xl font-bold text-[#1A1A1A] mb-3">Відгуки</h1>
        <p className="text-[#6B6B6B] max-w-xl mx-auto">
          Що кажуть наші клієнти про продукцію Viola
        </p>
      </div>

      <ReviewsList initialReviews={reviews} />
    </div>
  );
}
