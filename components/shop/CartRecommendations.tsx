"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import { sendGAEvent } from "@next/third-parties/google";
import toast from "react-hot-toast";

interface RecommendationProduct {
  id: string;
  name: string;
  name_en: string | null;
  slug: string;
  price: number;
  images: string[] | null;
  volume: string | null;
}

interface Props {
  variant?: "drawer" | "checkout";
  limit?: number;
}

export default function CartRecommendations({ variant = "drawer", limit = 4 }: Props) {
  const t = useTranslations("cartRecommendations");
  const locale = useLocale();
  const items = useCart((s) => s.items);
  const { addItem } = useCart();

  const [products, setProducts] = useState<RecommendationProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const excludeKey = items.map((i) => i.productId).sort().join(",");

  useEffect(() => {
    const controller = new AbortController();
    const fetchRecs = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/products/recommendations?exclude=${encodeURIComponent(excludeKey)}`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data = await res.json();
        setProducts((data.products ?? []).slice(0, limit));
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          console.error("recommendations fetch failed:", e);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
    return () => controller.abort();
  }, [excludeKey, limit]);

  const add = (p: RecommendationProduct) => {
    const name = locale === "en" && p.name_en ? p.name_en : p.name;
    addItem({
      productId: p.id,
      name,
      price: Number(p.price),
      image: p.images?.[0] ?? "",
      quantity: 1,
      volume: p.volume ?? undefined,
    });
    sendGAEvent("event", "cart_recommendation_add", {
      product_id: p.id,
      source: variant,
    });
    // Optimistically remove from the local list; the auto-refetch
    // triggered by the cart change will bring in fresh candidates.
    setProducts((prev) => prev.filter((r) => r.id !== p.id));
    toast.success(t("added"));
  };

  if (!loading && products.length === 0) return null;

  const wrapperClass =
    variant === "drawer"
      ? "border-t border-[#E8E4DE] px-4 py-4 bg-[#FAFAF8]"
      : "bg-white border border-[#E8E4DE] rounded p-5";

  return (
    <div className={wrapperClass}>
      <p className="text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-3">
        {t("title")}
      </p>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 bg-[#F0EDE8] rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {products.map((p) => {
            const displayName = locale === "en" && p.name_en ? p.name_en : p.name;
            const image = p.images?.[0] ?? "/placeholder-product.png";
            return (
              <li
                key={p.id}
                className="flex items-center gap-3 bg-white border border-[#E8E4DE] rounded p-2 hover:border-[#C4A882] transition-colors"
              >
                <Link
                  href={`/shop/${p.slug}`}
                  className="flex items-center gap-3 flex-1 min-w-0 group"
                >
                  <div className="relative w-12 h-12 flex-shrink-0 bg-[#F0EDE8] rounded overflow-hidden">
                    <Image
                      src={image}
                      alt={displayName}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] leading-tight text-[#1A1A1A] line-clamp-1 group-hover:text-[#C4A882] transition-colors">
                      {displayName}
                    </p>
                    <p className="text-xs font-semibold text-[#1A1A1A] mt-0.5">
                      {formatPrice(Number(p.price), locale)}
                    </p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => add(p)}
                  aria-label={t("addButton")}
                  className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-[#1A1A1A] text-white hover:bg-[#C4A882] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
