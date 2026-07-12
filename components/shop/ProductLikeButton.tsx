"use client";

import { useTranslations } from "next-intl";
import { sendGAEvent } from "@next/third-parties/google";
import { useProductLike } from "@/hooks/useProductLike";

interface Props {
  productId: string;
  initialCount: number;
  size?: "sm" | "md" | "lg";
  variant?: "card" | "page";
}

export default function ProductLikeButton({
  productId,
  initialCount,
  size = "md",
  variant = "card",
}: Props) {
  const t = useTranslations("productCard");
  const { liked, count, toggle, pending } = useProductLike(productId, initialCount);

  const iconSize = size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-5 h-5" : "w-4 h-4";
  const textSize = size === "sm" ? "text-[11px]" : size === "lg" ? "text-sm" : "text-xs";

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    const wasLiked = liked;
    toggle();
    if (!wasLiked) {
      sendGAEvent("event", "product_like", {
        product_id: productId,
        source: variant,
      });
    }
  };

  const showCount = count >= 5;

  if (variant === "page") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={liked}
        aria-label={liked ? t("unlike") : t("like")}
        className={`absolute top-3 right-3 z-10 inline-flex items-center justify-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-full shadow-md transition-all ${
          showCount ? "px-3 py-2" : "w-10 h-10 p-0"
        } ${liked ? "text-[#C75B6D]" : "text-[#1A1A1A] hover:text-[#C75B6D]"}`}
      >
        <Heart filled={liked} className="w-5 h-5" />
        {showCount && (
          <span className="text-xs font-medium tabular-nums">{count}</span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={liked}
      aria-label={liked ? t("unlike") : t("like")}
      className={`absolute top-2 right-2 z-10 inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm transition-all ${
        liked ? "text-[#C75B6D]" : "text-[#6B6B6B] hover:text-[#C75B6D]"
      }`}
    >
      <Heart filled={liked} className={iconSize} />
      {showCount && (
        <span className={`${textSize} font-medium tabular-nums`}>{count}</span>
      )}
    </button>
  );
}

function Heart({ filled, className }: { filled: boolean; className: string }) {
  return (
    <svg
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.8}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.687-4.5-1.935 0-3.597 1.126-4.313 2.733-.715-1.607-2.377-2.733-4.312-2.733C5.099 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  );
}
