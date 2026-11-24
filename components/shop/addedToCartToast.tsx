"use client";

import toast from "react-hot-toast";
import { useCart } from "@/hooks/useCart";

/**
 * The confirmation shown after "add to cart".
 *
 * The cart used to slide open on every add. On a phone it covers the whole
 * screen, so a shopper browsing the catalogue was thrown out of the list each
 * time, and the only prominent way on was "Place order" — in Oct–Nov 2026, 13
 * of the 23 people who opened checkout never touched the form. Now the shopper
 * stays where they are and this toast offers the cart as a choice.
 *
 * On phones it is a short note at the top of the screen with no button: the
 * cart is already under the thumb in the bottom bar, and the bottom third of
 * the screen is where the next "add to cart" is — a toast there got in the way
 * of the very buttons it was confirming. On wider screens it keeps its "open"
 * button, since the cart icon is a long way off in the header.
 */
export function showAddedToCart({
  title,
  detail,
  openLabel,
}: {
  /** The confirmation itself — "Added to cart". */
  title: string;
  /** What was added; one line, cut short if the name is long. */
  detail?: string;
  openLabel: string;
}) {
  const onPhone =
    typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

  toast.custom(
    (t) => (
      <div
        role="status"
        className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded bg-toast py-2 pl-4 pr-2 text-sm text-white shadow-lg max-md:py-2.5 max-md:pr-4 transition-opacity duration-200 ${
          t.visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <svg
          className="h-5 w-5 flex-shrink-0 text-accent"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <span className="min-w-0 flex-1 leading-snug">
          <span className="block font-medium">{title}</span>
          {detail && <span className="block truncate text-xs text-white/70">{detail}</span>}
        </span>
        {!onPhone && (
          <button
            type="button"
            onClick={() => {
              toast.dismiss(t.id);
              useCart.getState().openCart("toast");
            }}
            className="flex-shrink-0 rounded bg-white/10 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-accent transition-colors hover:bg-white/20"
          >
            {openLabel}
          </button>
        )}
      </div>
    ),
    onPhone
      ? { duration: 2500, position: "top-center" }
      : { duration: 4000, position: "top-right" },
  );
}
