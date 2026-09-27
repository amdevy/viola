"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import toast from "react-hot-toast";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import { sendGAEvent } from "@/lib/analytics";
import type { CareStep, RitualKind } from "@/lib/ritual";
import type { Product } from "@/types";

export type BundleProduct = Pick<Product, "id" | "name" | "price" | "images" | "volume">;

export interface BundleItem {
  product: BundleProduct;
  step: CareStep | null;
  /** The product this page is about: always in the set, can't be unticked. */
  isMain: boolean;
}

interface Props {
  kind: RitualKind;
  /** The whole routine in order (see lib/ritual.ts), this page's product included. */
  items: BundleItem[];
}

// "Same line" is only claimed when it's true; a hand-picked set says who picked it.
const SUBTITLE: Record<RitualKind, string> = {
  line: "subtitle",
  complement: "subtitleComplement",
  curated: "subtitleCurated",
};

const STEP_LABEL: Record<CareStep, string> = {
  cleanse: "stepCleanse",
  condition: "stepCondition",
  mask: "stepMask",
  leave_in: "stepLeaveIn",
};

export default function ProductBundle({ kind, items }: Props) {
  const t = useTranslations("productBundle");
  const locale = useLocale();
  const { addItem, openCart } = useCart();

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const bundleProducts = useMemo(
    () => items.filter((i) => i.isMain || selected.has(i.product.id)).map((i) => i.product),
    [items, selected],
  );

  const total = useMemo(
    () => bundleProducts.reduce((sum, p) => sum + Number(p.price), 0),
    [bundleProducts],
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addBundle = () => {
    bundleProducts.forEach((p) => {
      addItem({
        productId: p.id,
        name: p.name,
        price: Number(p.price),
        image: p.images?.[0] ?? "",
        quantity: 1,
        volume: p.volume ?? undefined,
      });
    });
    sendGAEvent("event", "bundle_add_to_cart", {
      items: bundleProducts.map((p) => p.id),
      value: total,
      ritual_kind: kind,
    });
    // Without this the button gave no sign of working, and a second press put
    // every product in the cart twice.
    toast.success(t("addedToast"));
    openCart();
  };

  if (!items.some((i) => !i.isMain)) return null;

  const canBuy = selected.size > 0;

  const label = (item: BundleItem) =>
    [item.step && t(STEP_LABEL[item.step]), item.isMain && t("thisProduct")].filter(Boolean).join(" · ");

  return (
    <section className="mt-16">
      <div className="mb-6">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-2">
          {t("title")}
        </h2>
        <p className="text-sm text-[#6B6B6B] max-w-2xl">{t(SUBTITLE[kind])}</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4 lg:gap-6">
        {/* Products */}
        <div className="bg-white border border-[#E8E4DE] rounded p-3 sm:p-6">
          {/* Mobile: stacked list */}
          <div className="flex flex-col gap-2 sm:hidden">
            {items.map((item) => (
              <BundleRow
                key={item.product.id}
                product={item.product}
                label={label(item)}
                locale={locale}
                selected={item.isMain || selected.has(item.product.id)}
                disabled={item.isMain}
                onToggle={item.isMain ? undefined : () => toggle(item.product.id)}
              />
            ))}
          </div>

          {/* Desktop: horizontal cards with + separators */}
          <div className="hidden sm:flex flex-wrap items-stretch gap-4">
            {items.map((item, i) => (
              <div key={item.product.id} className="flex items-stretch gap-4">
                {i > 0 && (
                  <div className="flex items-center text-[#C4A882] text-xl font-light select-none">
                    +
                  </div>
                )}
                <BundleCard
                  product={item.product}
                  label={label(item)}
                  locale={locale}
                  selected={item.isMain || selected.has(item.product.id)}
                  disabled={item.isMain}
                  onToggle={item.isMain ? undefined : () => toggle(item.product.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Summary — inline on mobile, sidebar on desktop */}
        <aside className="bg-white border border-[#E8E4DE] rounded p-4 sm:p-6 flex flex-row lg:flex-col items-center lg:items-stretch justify-between gap-4 lg:justify-between">
          <div className="flex-1 lg:flex-none">
            <p className="text-[10px] sm:text-xs uppercase tracking-widest text-[#6B6B6B] mb-1 lg:mb-2">
              {t("totalLabel")}
            </p>
            <p className="font-serif text-2xl lg:text-3xl font-bold text-[#1A1A1A]">
              {formatPrice(total, locale)}
            </p>
            <p className="hidden sm:block text-sm text-[#6B6B6B] mt-3">
              {t("itemsCount", { count: bundleProducts.length })}
            </p>
          </div>
          <button
            type="button"
            onClick={addBundle}
            disabled={!canBuy}
            className="flex-shrink-0 lg:mt-6 lg:w-full bg-[#1A1A1A] text-white px-5 py-3 text-xs sm:text-sm font-medium rounded uppercase tracking-wider hover:bg-[#C4A882] transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {t("buyBundle")}
          </button>
        </aside>
      </div>
    </section>
  );
}

/* Mobile row layout: image | step + name + price | checkbox */
function BundleRow({
  product,
  label,
  locale,
  selected,
  disabled,
  onToggle,
}: {
  product: BundleProduct;
  label: string;
  locale: string;
  selected: boolean;
  disabled?: boolean;
  onToggle?: () => void;
}) {
  const image = product.images?.[0] ?? "/placeholder-product.png";
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={selected}
      className={`flex items-center gap-3 p-2 rounded border transition-all text-left ${
        selected
          ? "border-[#C4A882] bg-[#FAFAF8]"
          : "border-[#E8E4DE] bg-white"
      } ${disabled ? "cursor-default" : "cursor-pointer"}`}
    >
      <div className="relative w-16 h-16 flex-shrink-0 bg-[#F0EDE8] rounded overflow-hidden">
        <Image
          src={image}
          alt={product.name}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        {label && (
          <p className="text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-0.5">{label}</p>
        )}
        <p className="text-xs text-[#1A1A1A] leading-tight line-clamp-2 mb-1">
          {product.name}
        </p>
        <p className="text-sm font-semibold text-[#1A1A1A]">
          {formatPrice(Number(product.price), locale)}
        </p>
      </div>
      <div
        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
          selected
            ? "bg-[#C4A882] border-[#C4A882] text-white"
            : "border-[#E8E4DE] bg-white text-transparent"
        }`}
        aria-hidden
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </button>
  );
}

/* Desktop card layout: image on top, step + name + price below */
function BundleCard({
  product,
  label,
  locale,
  selected,
  disabled,
  onToggle,
}: {
  product: BundleProduct;
  label: string;
  locale: string;
  selected: boolean;
  disabled?: boolean;
  onToggle?: () => void;
}) {
  const image = product.images?.[0] ?? "/placeholder-product.png";
  const clickable = !disabled && !!onToggle;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={selected}
      className={`relative flex flex-col items-start text-left w-40 md:w-44 rounded border transition-all ${
        selected
          ? "border-[#C4A882] bg-[#FAFAF8]"
          : "border-[#E8E4DE] bg-white hover:border-[#C4A882]"
      } ${clickable ? "cursor-pointer" : "cursor-default"}`}
    >
      <div className="relative w-full aspect-square bg-[#F0EDE8] rounded-t overflow-hidden">
        <Image
          src={image}
          alt={product.name}
          fill
          sizes="176px"
          className="object-cover"
        />
        {selected && !disabled && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#C4A882] text-white flex items-center justify-center shadow">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-3 w-full">
        {label && (
          <p className="text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-1">{label}</p>
        )}
        <p className="text-xs text-[#1A1A1A] leading-tight line-clamp-2 mb-1">
          {product.name}
        </p>
        <p className="text-sm font-semibold text-[#1A1A1A]">
          {formatPrice(Number(product.price), locale)}
        </p>
      </div>
    </button>
  );
}
