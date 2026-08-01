"use client";

import { Fragment, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import type { Review } from "./page";

function GoogleBadge({ url }: { url?: string | null }) {
  const Content = (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F5F6F7] border border-[#E8E4DE] text-[10px] font-medium text-[#5F6368]">
      <svg viewBox="0 0 24 24" className="w-3 h-3" aria-hidden>
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.75 3.28-8.1z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.56-2.77c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.28-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.85 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.67-2.84z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.67 2.84C6.72 7.31 9.14 5.38 12 5.38z"
        />
      </svg>
      Google
    </span>
  );
  if (!url) return Content;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="hover:opacity-80 transition-opacity"
      aria-label="View original review on Google"
    >
      {Content}
    </a>
  );
}

function StarRating({
  rating,
  interactive,
  onRate,
}: {
  rating: number;
  interactive?: boolean;
  onRate?: (r: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(star)}
          className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
        >
          <svg
            className={`w-5 h-5 ${star <= rating ? "text-[#C4A882]" : "text-[#E8E4DE]"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function ReviewsList({
  initialReviews,
  slot,
  slotAfter,
}: {
  initialReviews: Review[];
  slot?: React.ReactNode;
  slotAfter?: number;
}) {
  const t = useTranslations("reviewForm");
  const reviews = initialReviews;
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    rating: 5,
    text: "",
  });

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.text.trim()) {
      toast.error(t("fillAllFields"));
      return;
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("reviews").insert({
        author_name: formData.name,
        rating: formData.rating,
        text: formData.text,
        // approved is deliberately absent: anon has no INSERT privilege on that
        // column, and the DB default (false) is what we want anyway.
      });

      if (error) throw error;

      toast.success(t("thankYou"));
      setShowForm(false);
      setFormData({ name: "", rating: 5, text: "" });
    } catch {
      toast.error(t("submitError"));
    }
    setSubmitting(false);
  };

  return (
    <>
      {/* Summary + Write button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 pb-8 border-b border-[#E8E4DE]">
        {reviews.length > 0 ? (
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-[#1A1A1A]">{avgRating}</p>
              <StarRating rating={Math.round(Number(avgRating))} />
              <p className="text-xs text-[#6B6B6B] mt-1">{t("reviewCount", { count: reviews.length })}</p>
            </div>
          </div>
        ) : (
          <p className="text-[#6B6B6B]">{t("noReviews")}</p>
        )}
        <Button onClick={() => setShowForm(true)}>{t("writeReview")}</Button>
      </div>

      {/* Reviews list */}
      <div className="space-y-6">
        {reviews.map((review, i) => (
          <Fragment key={review.id}>
            {slot && slotAfter !== undefined && i === slotAfter && (
              <div>{slot}</div>
            )}
            <div className="bg-white rounded border border-[#E8E4DE] p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 bg-[#C4A882] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {review.author_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-[#1A1A1A] text-sm">
                        {review.author_name}
                      </p>
                      {review.source === "google" && <GoogleBadge url={review.source_url} />}
                    </div>
                    <p className="text-xs text-[#6B6B6B]">
                      {new Date(review.created_at).toLocaleDateString("uk-UA", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
              <StarRating rating={review.rating} />
            </div>

            <p className="text-sm text-[#1A1A1A] leading-relaxed">{review.text}</p>

            {review.product && (
              <div className="mt-3 pt-3 border-t border-[#E8E4DE]">
                <Link
                  href={`/shop/${review.product.slug}`}
                  className="text-xs text-[#C4A882] hover:underline"
                >
                  {review.product.name}
                </Link>
              </div>
            )}
            </div>
          </Fragment>
        ))}
      </div>

      {/* Review form modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={t("writeReview")}
      >
        <div className="space-y-4">
          {/* Limits mirror the RLS check on reviews — enforced here so an
              over-long review is prevented rather than rejected opaquely. */}
          <Input
            label={t("yourName")}
            placeholder={t("namePlaceholder")}
            maxLength={100}
            value={formData.name}
            onChange={(e) =>
              setFormData((f) => ({ ...f, name: e.target.value }))
            }
          />

          <div>
            <label className="text-sm font-medium text-[#1A1A1A] block mb-2">
              {t("rating")}
            </label>
            <StarRating
              rating={formData.rating}
              interactive
              onRate={(r) => setFormData((f) => ({ ...f, rating: r }))}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[#1A1A1A] block mb-1">
              {t("yourReview")}
            </label>
            <textarea
              rows={4}
              maxLength={2000}
              placeholder={t("reviewPlaceholder")}
              value={formData.text}
              onChange={(e) =>
                setFormData((f) => ({ ...f, text: e.target.value }))
              }
              className="w-full px-4 py-3 text-sm border border-[#E8E4DE] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A882] resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSubmit}
              loading={submitting}
              className="flex-1"
            >
              {t("submit")}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              className="flex-1"
            >
              {t("cancel")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
