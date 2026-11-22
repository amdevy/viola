"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { formatPrice, formatVolume } from "@/lib/utils";
import { sendGAEvent } from "@/lib/analytics";
import type { BundleProduct } from "./ProductBundle";

interface Props {
  product: BundleProduct;
  /** The care step this product covers — "Mask", "Leave-in"… */
  label: string;
  locale: string;
  selected: boolean;
  onToggle: () => void;
  onClose: () => void;
}

/**
 * A look at a product offered in the care ritual, without leaving the page.
 *
 * The ritual rows could only be ticked: there was no way to see what the mask
 * or the tonic actually is before adding it. Opening its page would do, but it
 * throws away the set the shopper has just put together — so the product comes
 * to them instead: photo, what it is, the price, and the page one tap away for
 * whoever wants all of it.
 *
 * On phones it is a sheet rising from the bottom edge, with every action in the
 * thumb's reach; on wider screens, a small dialog in the middle.
 */
export default function BundleQuickView({
  product,
  label,
  locale,
  selected,
  onToggle,
  onClose,
}: Props) {
  const t = useTranslations("productBundle");
  const panelRef = useRef<HTMLDivElement>(null);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, []);

  const image = product.images?.[0] ?? "/placeholder-product.png";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-xl bg-white shadow-2xl outline-none sm:max-w-md sm:rounded"
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="relative aspect-[4/3] w-full bg-[#F0EDE8]">
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, 448px"
              className="object-contain"
            />
          </div>
          <div className="p-4">
            {label && (
              <p className="mb-1 text-[10px] uppercase tracking-widest text-[#C4A882]">{label}</p>
            )}
            <h3 className="font-serif text-xl font-bold leading-snug text-[#1A1A1A]">
              {product.name}
            </h3>
            <p className="mt-2 text-sm text-[#6B6B6B]">
              <span className="text-base font-semibold text-[#1A1A1A]">
                {formatPrice(Number(product.price), locale)}
              </span>
              {product.volume && <> · {formatVolume(product.volume, locale)}</>}
            </p>
            {product.summary && (
              <p className="mt-3 text-sm leading-relaxed text-[#1A1A1A]">{product.summary}</p>
            )}
          </div>
        </div>

        {/* Actions stay put at the bottom edge while the text scrolls. */}
        <div className="space-y-2 border-t border-[#E8E4DE] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => {
              onToggle();
              onClose();
            }}
            className={`w-full rounded py-3.5 text-sm font-medium uppercase tracking-wider transition-colors ${
              selected
                ? "border border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-[#FAFAF8]"
                : "bg-[#1A1A1A] text-white hover:bg-[#C4A882]"
            }`}
          >
            {selected ? t("removeFromBundle") : t("addToBundle")}
          </button>
          <div className="flex gap-2">
            {product.slug && (
              <Link
                href={`/shop/${product.slug}`}
                onClick={() =>
                  sendGAEvent("event", "select_content", {
                    content_type: "bundle_quick_view",
                    content_id: "open_product",
                    item_id: product.id,
                  })
                }
                className="flex-1 rounded border border-[#E8E4DE] py-3 text-center text-sm font-medium text-[#1A1A1A] transition-colors hover:border-[#C4A882]"
              >
                {t("openProduct")}
              </Link>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded border border-[#E8E4DE] py-3 text-center text-sm font-medium text-[#6B6B6B] transition-colors hover:border-[#C4A882]"
            >
              {t("close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
