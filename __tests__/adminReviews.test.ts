import { describe, it, expect } from "vitest";
import {
  canLinkToProduct,
  countByFilter,
  defaultFilter,
  matchesFilter,
  type AdminReview,
} from "@/lib/admin-reviews";

const review = (over: Partial<AdminReview>): AdminReview => ({
  id: "r",
  author_name: "Олена",
  rating: 5,
  text: "Чудовий шампунь",
  product_id: null,
  approved: true,
  source: "internal",
  source_url: null,
  created_at: "2026-09-01T10:00:00Z",
  ...over,
});

const pending = review({ id: "pending", approved: false, product_id: "p1" });
const unlinked = review({ id: "unlinked" });
const linked = review({ id: "linked", product_id: "p1" });
const google = review({ id: "google", source: "google", source_url: "https://maps.google.com/x" });

describe("модерація відгуків", () => {
  it("відгуки з Google Maps до товару не прив'язуються", () => {
    // Google рахує оцінку товару лише з відгуків, залишених на сайті.
    expect(canLinkToProduct(google)).toBe(false);
    expect(canLinkToProduct(unlinked)).toBe(true);
  });

  it("«Без товару» — лише схвалені відгуки з сайту без товару", () => {
    expect(matchesFilter(unlinked, "unlinked")).toBe(true);
    expect(matchesFilter(linked, "unlinked")).toBe(false);
    expect(matchesFilter(google, "unlinked")).toBe(false);
    expect(matchesFilter(pending, "unlinked")).toBe(false);
  });

  it("рахує кожну вкладку", () => {
    expect(countByFilter([pending, unlinked, linked, google])).toEqual({
      pending: 1,
      unlinked: 1,
      approved: 3,
      all: 4,
    });
  });

  it("відкривається на тому, що треба зробити", () => {
    expect(defaultFilter(countByFilter([pending, unlinked]))).toBe("pending");
    expect(defaultFilter(countByFilter([unlinked, google]))).toBe("unlinked");
    expect(defaultFilter(countByFilter([linked, google]))).toBe("all");
  });
});
