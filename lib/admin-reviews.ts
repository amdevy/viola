/**
 * Moderation rules for the admin "Відгуки" page, kept out of the component so
 * they can be tested without a browser or Supabase.
 *
 * Why the page exists: a review left on a product page lands in the database
 * unapproved, and a product only gets stars in Google (Product JSON-LD
 * aggregateRating) once an approved review is linked to it. Until this page
 * both steps needed the Supabase dashboard — so in September 2026 only 5 of 17
 * approved reviews were linked to a product.
 */

export type AdminReview = {
  id: string;
  author_name: string;
  rating: number;
  text: string;
  product_id: string | null;
  approved: boolean;
  /** "internal" — left on this site; "google" — copied from Google Maps. */
  source: string;
  source_url: string | null;
  created_at: string;
};

export type ReviewFilter = "pending" | "unlinked" | "approved" | "all";

export const REVIEW_FILTERS: { key: ReviewFilter; label: string }[] = [
  { key: "pending", label: "Очікують схвалення" },
  { key: "unlinked", label: "Без товару" },
  { key: "approved", label: "Схвалені" },
  { key: "all", label: "Усі" },
];

/**
 * Only reviews left on this site may carry a product's stars. Google counts a
 * product rating only from reviews collected on the site that sells it, and
 * the Google Maps reviews are about the salon, not a product.
 */
export function canLinkToProduct(review: Pick<AdminReview, "source">): boolean {
  return review.source === "internal";
}

export function matchesFilter(review: AdminReview, filter: ReviewFilter): boolean {
  switch (filter) {
    case "pending":
      return !review.approved;
    case "unlinked":
      // The list to work through: published, linkable, but giving no product
      // its stars yet.
      return review.approved && review.product_id === null && canLinkToProduct(review);
    case "approved":
      return review.approved;
    case "all":
      return true;
  }
}

export function countByFilter(reviews: AdminReview[]): Record<ReviewFilter, number> {
  const counts = { pending: 0, unlinked: 0, approved: 0, all: 0 };
  for (const review of reviews) {
    for (const { key } of REVIEW_FILTERS) {
      if (matchesFilter(review, key)) counts[key] += 1;
    }
  }
  return counts;
}

/** Opens on whatever needs doing: moderation first, then linking. */
export function defaultFilter(counts: Record<ReviewFilter, number>): ReviewFilter {
  if (counts.pending > 0) return "pending";
  if (counts.unlinked > 0) return "unlinked";
  return "all";
}
