import { Metadata } from "next";
import { Suspense } from "react";
import ShopContent from "./ShopContent";

export const metadata: Metadata = {
  title: "Купити косметику Na Golov[y] — Шампуні, Маски, Кондиціонери",
  description:
    "Купити Na Golovy (На Голову) в Україні. Професійна аромакосметика для волосся: шампуні, кондиціонери, маски, незмивний догляд. Доставка Новою Поштою.",
  keywords: [
    "Na Golovy", "Na Gólov[y]", "на голову",
    "купити Na Golovy", "na golovy купити", "на голову косметика",
    "na golovy шампунь", "na golovy маска", "na golovy кондиціонер",
    "косметика для волосся Na Golovy", "аромакосметика Na Golovy",
    "на голову шампунь купити", "на голову косметика для волосся",
  ],
  alternates: { canonical: "https://violamukachevo.com/shop" },
};

export default function ShopPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* SEO intro — visible to crawlers */}
      <div className="mb-6">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-3">
          Косметика Na Golov[y] — Купити в Україні
        </h1>
        <p className="text-[#6B6B6B] max-w-2xl leading-relaxed">
          Офіційний магазин професійної аромакосметики Na Golovy (На Голову).
          Шампуні, кондиціонери, маски та незмивний догляд для збереження кольору
          та здоров&apos;я волосся. Доставка Новою Поштою по всій Україні.
        </p>
      </div>

      <Suspense>
        <ShopContent />
      </Suspense>
    </div>
  );
}
