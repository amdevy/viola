"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { useCart } from "@/hooks/useCart";
import { showAddedToCart } from "@/components/shop/addedToCartToast";
import { formatPrice } from "@/lib/utils";
import { sendGAEvent } from "@/lib/analytics";
import BundleQuickView from "@/components/shop/BundleQuickView";
import type { CareStep, RitualKind } from "@/lib/ritual";
import type { Product } from "@/types";

export type BundleProduct = Pick<Product, "id" | "name" | "price" | "images" | "volume"> & {
  /** With a slug the quick look can link to the product's own page. */
  slug?: string;
  /** The opening of the description, shown in the quick look. */
  summary?: string | null;
};

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
  const tcart = useTranslations("cart");
  const locale = useLocale();
  const { addItem } = useCart();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  // The product being looked at in the quick view, if any.
  const [previewId, setPreviewId] = useState<string | null>(null);

  const bundleProducts = useMemo(
    () => items.filter((i) => i.isMain || selected.has(i.product.id)).map((i) => i.product),
    [items, selected],
  );

  const total = useMemo(
    () => bundleProducts.reduce((sum, p) => sum + Number(p.price), 0),
    [bundleProducts],
  );

  // `method` says which control did it — the row/card toggle ("list") or the
  // quick view's button ("quick_view") — so the two ways can be compared.
  const toggle = (id: string, method: "list" | "quick_view") => {
    const product = items.find((i) => i.product.id === id)?.product;
    if (product) {
      sendGAEvent("event", selected.has(id) ? "bundle_item_remove" : "bundle_item_add", {
        method,
        items: [{ item_id: product.id, item_name: product.name, price: Number(product.price) }],
      });
    }
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
    // every product in the cart twice. The toast carries the way to the cart;
    // the cart itself no longer opens over the page (see addedToCartToast.tsx).
    showAddedToCart({ title: t("addedToast"), openLabel: tcart("openShort") });
  };

  if (!items.some((i) => !i.isMain)) return null;

  const canBuy = selected.size > 0;

  const label = (item: BundleItem) =>
    [item.step && t(STEP_LABEL[item.step]), item.isMain && t("thisProduct")].filter(Boolean).join(" · ");

  const openPreview = (item: BundleItem) => {
    sendGAEvent("event", "select_item", {
      item_list_id: "care_ritual",
      item_list_name: "care_ritual",
      items: [{ item_id: item.product.id, item_name: item.product.name, price: Number(item.product.price) }],
    });
    setPreviewId(item.product.id);
  };
  const previewItem = items.find((i) => i.product.id === previewId && !i.isMain);

  // Every product but the page's own has two controls: "details" opens the
  // quick look, the toggle puts it in or out of the set. The page's own
  // product has neither — it is always in the set and the shopper is already
  // looking at it.
  const controls = (item: BundleItem) => {
    const isSelected = selected.has(item.product.id);
    return {
      product: item.product,
      label: label(item),
      locale,
      isMain: item.isMain,
      selected: item.isMain || isSelected,
      detailsLabel: t("details"),
      // One accessible name for both layouts' "details" control, so it says
      // which product it opens rather than a bare "Details".
      detailsAria: t("detailsAria", { name: item.product.name }),
      toggleText: t(isSelected ? "inSet" : "add"),
      toggleLabel: t(isSelected ? "removeAria" : "addAria", { name: item.product.name }),
      onToggle: () => toggle(item.product.id, "list"),
      onPreview: () => openPreview(item),
    };
  };

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
          {/* Mobile: the routine as numbered steps, in the order they are used */}
          <ol className="flex flex-col sm:hidden">
            {items.map((item, i) => (
              <BundleStep
                key={item.product.id}
                {...controls(item)}
                number={i + 1}
                isLast={i === items.length - 1}
              />
            ))}
          </ol>

          {/* Desktop: horizontal cards with + separators */}
          <div className="hidden sm:flex flex-wrap items-stretch gap-4">
            {items.map((item, i) => (
              <div key={item.product.id} className="flex items-stretch gap-4">
                {i > 0 && (
                  <div className="flex items-center text-[#C4A882] text-xl font-light select-none">
                    +
                  </div>
                )}
                <BundleCard {...controls(item)} />
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
            {/* On phones this sits right under the total, so it is clear how
                many products that price covers. */}
            <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5 sm:mt-3">
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

      {previewItem && (
        <BundleQuickView
          product={previewItem.product}
          label={label(previewItem)}
          locale={locale}
          selected={selected.has(previewItem.product.id)}
          onToggle={() => toggle(previewItem.product.id, "quick_view")}
          onClose={() => setPreviewId(null)}
        />
      )}
    </section>
  );
}

interface ControlProps {
  product: BundleProduct;
  label: string;
  locale: string;
  isMain: boolean;
  selected: boolean;
  detailsLabel: string;
  detailsAria: string;
  toggleText: string;
  toggleLabel: string;
  onToggle: () => void;
  onPreview: () => void;
}

function Tick({ selected, className = "" }: { selected: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
        selected
          ? "border-[#C4A882] bg-[#C4A882] text-white"
          : "border-[#D9D4CC] bg-white text-transparent"
      } ${className}`}
    >
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

/* Mobile step: [number + connector] [card: image | step + name + price; details | add/in set] */
function BundleStep({
  product,
  label,
  locale,
  isMain,
  selected,
  detailsLabel,
  detailsAria,
  toggleText,
  toggleLabel,
  onToggle,
  onPreview,
  number,
  isLast,
}: ControlProps & { number: number; isLast: boolean }) {
  const image = product.images?.[0] ?? "/placeholder-product.png";

  return (
    <li className="flex gap-2.5">
      {/* The rail: steps in the set are filled in gold, and so is the line
          leading on from them, so the chosen part of the routine reads at a glance. */}
      <div aria-hidden className="flex w-7 flex-shrink-0 flex-col items-center gap-1">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-semibold text-[#1A1A1A] ${
            selected ? "bg-[#C4A882]" : "border-[1.5px] border-[#6B6B6B] bg-white"
          }`}
        >
          {number}
        </span>
        {!isLast && (
          <span className={`w-0.5 flex-1 ${selected ? "bg-[#C4A882]" : "bg-[#E8E4DE]"}`} />
        )}
      </div>

      <div
        className={`flex min-w-0 flex-1 flex-col gap-2.5 rounded border p-2.5 transition-colors ${
          isLast ? "" : "mb-2.5"
        } ${selected ? "border-[#C4A882] bg-[#FDF9F5]" : "border-[#E8E4DE] bg-white"}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative h-[52px] w-[52px] flex-shrink-0 overflow-hidden rounded bg-[#F0EDE8]">
            <Image src={image} alt="" fill sizes="52px" className="object-cover" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            {label && (
              <p
                className={`text-[11px] font-semibold uppercase tracking-widest ${
                  selected ? "text-[#7A5C36]" : "text-[#6B6B6B]"
                }`}
              >
                {label}
              </p>
            )}
            <p className="text-[13px] leading-snug text-[#1A1A1A] line-clamp-2">{product.name}</p>
            <p className="text-sm font-semibold text-[#1A1A1A]">
              {formatPrice(Number(product.price), locale)}
            </p>
          </div>
        </div>

        {!isMain && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onPreview}
              aria-label={detailsAria}
              className="h-11 flex-1 rounded border border-[#D9D4CC] bg-white text-[13px] font-medium text-[#1A1A1A] transition-colors hover:border-[#C4A882]"
            >
              {detailsLabel}
            </button>
            <button
              type="button"
              onClick={onToggle}
              aria-pressed={selected}
              aria-label={toggleLabel}
              className={`flex h-11 flex-[1.3] items-center justify-center gap-1.5 rounded text-[13px] font-semibold transition-colors ${
                selected ? "bg-[#C4A882] text-[#1A1A1A]" : "bg-[#1A1A1A] text-white"
              }`}
            >
              {selected ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                </svg>
              )}
              {toggleText}
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

/* Desktop card layout: image on top, step + name + price below; tick in the corner */
function BundleCard({
  product,
  label,
  locale,
  isMain,
  selected,
  detailsLabel,
  detailsAria,
  toggleLabel,
  onToggle,
  onPreview,
}: ControlProps) {
  const image = product.images?.[0] ?? "/placeholder-product.png";
  const body = (
    <>
      <div className="relative w-full aspect-square bg-[#F0EDE8] rounded-t overflow-hidden">
        <Image src={image} alt="" fill sizes="176px" className="object-cover" />
      </div>
      <div className="p-3 w-full">
        {label && (
          <p className="text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-1">{label}</p>
        )}
        <p className="text-xs text-[#1A1A1A] leading-tight line-clamp-2 mb-1">{product.name}</p>
        <p className="flex items-baseline gap-2 text-sm font-semibold text-[#1A1A1A]">
          {formatPrice(Number(product.price), locale)}
          {!isMain && (
            <span className="text-xs font-medium text-[#C4A882] underline underline-offset-2">
              {detailsLabel}
            </span>
          )}
        </p>
      </div>
    </>
  );
  const frame = `relative w-40 md:w-44 rounded border transition-all ${
    selected ? "border-[#C4A882] bg-[#FAFAF8]" : "border-[#E8E4DE] bg-white hover:border-[#C4A882]"
  }`;

  if (isMain) {
    return <div className={`${frame} flex flex-col items-start text-left`}>{body}</div>;
  }

  return (
    <div className={frame}>
      <button
        type="button"
        onClick={onPreview}
        aria-label={detailsAria}
        className="flex h-full w-full flex-col items-start text-left"
      >
        {body}
      </button>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        aria-label={toggleLabel}
        className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-full"
      >
        <Tick selected={selected} className="shadow" />
      </button>
    </div>
  );
}
