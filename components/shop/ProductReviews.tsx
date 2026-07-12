"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export interface ProductReview {
  id: string;
  author_name: string;
  rating: number;
  text: string;
  created_at: string;
}

function StarRow({
  rating,
  size = "md",
  interactive,
  onRate,
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRate?: (r: number) => void;
}) {
  const px = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-7 h-7" : "w-5 h-5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(star)}
          className={interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}
        >
          <svg
            className={`${px} ${star <= rating ? "text-[#C4A882]" : "text-[#E8E4DE]"}`}
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

export default function ProductReviews({
  productId,
  reviews,
}: {
  productId: string;
  reviews: ProductReview[];
}) {
  const t = useTranslations("productReviews");
  const tf = useTranslations("reviewForm");
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", rating: 5, text: "" });

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const visible = expanded ? reviews : reviews.slice(0, 3);
  const dateLocale = locale === "en" ? "en-US" : "uk-UA";

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.text.trim()) {
      toast.error(tf("fillAllFields"));
      return;
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("reviews").insert({
        author_name: form.name,
        rating: form.rating,
        text: form.text,
        product_id: productId,
        approved: false,
      });
      if (error) throw error;
      toast.success(tf("thankYou"));
      setShowForm(false);
      setForm({ name: "", rating: 5, text: "" });
    } catch {
      toast.error(tf("submitError"));
    }
    setSubmitting(false);
  };

  return (
    <section className="mt-16 pt-12 border-t border-[#E8E4DE]">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-2">
            {t("title")}
          </h2>
          {reviews.length > 0 ? (
            <div className="flex items-center gap-3">
              <StarRow rating={Math.round(avg)} />
              <span className="text-sm font-semibold text-[#1A1A1A]">
                {avg.toFixed(1)}
              </span>
              <span className="text-sm text-[#6B6B6B]">
                · {tf("reviewCount", { count: reviews.length })}
              </span>
            </div>
          ) : (
            <p className="text-sm text-[#6B6B6B]">{t("emptyHint")}</p>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="text-sm font-medium text-[#1A1A1A] border-b border-[#1A1A1A] pb-0.5 hover:text-[#C4A882] hover:border-[#C4A882] transition-colors self-start sm:self-auto"
        >
          {tf("writeReview")}
        </button>
      </div>

      {reviews.length > 0 && (
        <div className="space-y-5">
          {visible.map((r) => (
            <article
              key={r.id}
              className="bg-white border border-[#E8E4DE] rounded p-5"
            >
              <header className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#C4A882] text-white flex items-center justify-center text-sm font-semibold">
                    {r.author_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">
                      {r.author_name}
                    </p>
                    <p className="text-xs text-[#6B6B6B]">
                      {new Date(r.created_at).toLocaleDateString(dateLocale, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <StarRow rating={r.rating} size="sm" />
              </header>
              <p className="text-sm text-[#1A1A1A] leading-relaxed whitespace-pre-line">
                {r.text}
              </p>
            </article>
          ))}

          {reviews.length > 3 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="block mx-auto text-sm font-medium text-[#C4A882] hover:text-[#1A1A1A] transition-colors pt-2"
            >
              {expanded ? t("showLess") : t("showMore", { count: reviews.length - 3 })}
            </button>
          )}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={tf("writeReview")}
      >
        <div className="space-y-4">
          <Input
            label={tf("yourName")}
            placeholder={tf("namePlaceholder")}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <div>
            <label className="text-sm font-medium text-[#1A1A1A] block mb-2">
              {tf("rating")}
            </label>
            <StarRow
              rating={form.rating}
              size="lg"
              interactive
              onRate={(r) => setForm((f) => ({ ...f, rating: r }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#1A1A1A] block mb-1">
              {tf("yourReview")}
            </label>
            <textarea
              rows={4}
              placeholder={tf("reviewPlaceholder")}
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              className="w-full px-4 py-3 text-sm border border-[#E8E4DE] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A882] resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSubmit} loading={submitting} className="flex-1">
              {tf("submit")}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              className="flex-1"
            >
              {tf("cancel")}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
