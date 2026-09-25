import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { AdminReview } from "@/lib/admin-reviews";
import ReviewsManager from "./ReviewsManager";

export const metadata: Metadata = { title: "Admin — Відгуки" };

// Loaded on the server with the admin's session (RLS: reviews_admin_all), so
// the list is there on first paint and pending reviews are visible too.
export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const [reviewsRes, productsRes] = await Promise.all([
    supabase
      .from("reviews")
      .select("id, author_name, rating, text, product_id, approved, source, source_url, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("products").select("id, name").order("name"),
  ]);

  return (
    <ReviewsManager
      initialReviews={(reviewsRes.data as AdminReview[] | null) ?? []}
      products={(productsRes.data as { id: string; name: string }[] | null) ?? []}
      loadError={reviewsRes.error?.message ?? null}
    />
  );
}
