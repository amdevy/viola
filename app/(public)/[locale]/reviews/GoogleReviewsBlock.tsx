import { getTranslations } from "next-intl/server";
import type { Review } from "./page";

interface Props {
  reviews: Review[];
  locale: string;
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.75 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.56-2.77c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.28-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.85 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.67-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.67 2.84C6.72 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`${cls} ${s <= Math.round(rating) ? "text-[#FBBC04]" : "text-[#E8E4DE]"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// Update these when the Google Business Profile numbers change.
const GOOGLE_RATING = 4.9;
const GOOGLE_REVIEWS_COUNT = 103;
const GOOGLE_PROFILE_URL =
  "https://www.google.com/search?q=viola+mukachevo#lrd=0x4739ac81d71e90c9:0x1abbd1e312a868e9,1";

export default async function GoogleReviewsBlock({ reviews, locale }: Props) {
  const t = await getTranslations({ locale, namespace: "googleReviews" });

  const rating = GOOGLE_RATING;
  const count = GOOGLE_REVIEWS_COUNT;
  const profileUrl = GOOGLE_PROFILE_URL;

  const display = reviews.slice(0, 3);
  if (display.length === 0) return null;

  return (
    <section className="bg-white border border-[#E8E4DE] rounded-lg overflow-hidden mb-10">
      <div className="grid md:grid-cols-[220px_1fr] divide-y md:divide-y-0 md:divide-x divide-[#E8E4DE]">
        {/* Left — score */}
        <div className="p-6 flex flex-col items-center justify-center text-center bg-[#FAFAF8]">
          <div className="flex items-center gap-2 mb-3">
            <GoogleLogo className="w-6 h-6" />
            <span className="text-sm font-medium text-[#5F6368]">Google</span>
          </div>
          <p className="text-5xl font-bold text-[#1A1A1A] leading-none">
            {rating.toFixed(1)}
          </p>
          <div className="my-2">
            <Stars rating={rating} size="lg" />
          </div>
          <p className="text-xs text-[#6B6B6B]">
            {t("basedOn", { count })}
          </p>
        </div>

        {/* Right — top reviews */}
        <div className="p-6">
          <p className="text-xs uppercase tracking-widest text-[#6B6B6B] mb-4">
            {t("topReviewsTitle")}
          </p>
          <div className="space-y-4">
            {display.map((r) => (
              <div key={r.id} className="border-l-2 border-[#C4A882] pl-3">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-[#1A1A1A]">{r.author_name}</p>
                  <Stars rating={r.rating} />
                </div>
                <p className="text-sm text-[#1A1A1A] leading-relaxed line-clamp-3">
                  {r.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <a
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-[#1A1A1A] text-white text-center text-sm font-medium py-3 hover:bg-[#C4A882] transition-colors uppercase tracking-wider"
      >
        {t("viewAllOnGoogle", { count })}
        <span className="ml-1">→</span>
      </a>
    </section>
  );
}
