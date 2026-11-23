"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { sendGAEvent } from "@/lib/analytics";

interface Props {
  children: React.ReactNode;
  /** Toggle label while collapsed ("Читати далі"). */
  moreLabel: string;
  /** Toggle label while expanded ("Згорнути"). */
  lessLabel: string;
  className?: string;
  /**
   * Readable id of the page ("shop", or the category slug). With it, expanding
   * the text sends `intro_expand`; without it the component sends nothing.
   */
  analyticsId?: string;
  /** GA event sent on expanding (default `intro_expand`). */
  analyticsEvent?: string;
  /** `content_type` of that event (default `catalog_intro`). */
  analyticsContentType?: string;
  /**
   * How far it is clipped below md while collapsed. Default: the two intro
   * lines described below. Must keep the `max-md:` prefix.
   */
  collapsedClassName?: string;
  /**
   * Size, place and gradient of the fade over the cut. Default: the end of
   * the second line. It is always absolute, below md only.
   */
  fadeClassName?: string;
}

const DEFAULT_COLLAPSED = "max-md:max-h-[3.25rem] max-md:overflow-hidden";
const DEFAULT_FADE = "right-0 h-[1.625rem] w-1/3 bg-linear-to-r from-[#FAFAF8]/0 to-[#FAFAF8]";

/**
 * An intro that takes two lines on phones, so the products start higher, and
 * reads in full from md up.
 *
 * The whole text stays in the server HTML and stays rendered while collapsed:
 * it is only clipped by height, never hidden or left out, because these
 * intros are what the category pages rank on. Collapsed is the server default
 * and is pure CSS, so hydration moves nothing.
 *
 * Collapsed, below md only, the wrapper is cut to two lines of the intro
 * paragraph (16px text with leading-relaxed: 2 × 26px = 3.25rem) and the end
 * of the second line fades into the page. A fade rather than line-clamp's
 * ellipsis: when the second line ended on a full stop the clamp added "..."
 * after it and the intro read "(Na Golovy)....". Everything after the cut —
 * on category pages the facts line too — is clipped with it. The max-md:
 * prefix keeps md and up untouched: nothing is clipped there and no fade.
 */
export default function CollapsibleIntro({
  children,
  moreLabel,
  lessLabel,
  className = "",
  analyticsId,
  analyticsEvent = "intro_expand",
  analyticsContentType = "catalog_intro",
  collapsedClassName = DEFAULT_COLLAPSED,
  fadeClassName = DEFAULT_FADE,
}: Props) {
  const id = useId();
  const textRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  // Shown until measured: the server cannot know whether the text is cut.
  const [isCut, setIsCut] = useState(true);

  const measure = useCallback(() => {
    const el = textRef.current;
    // While expanded nothing is clipped, so the measurement would say "short".
    if (!el || expanded) return;
    setIsCut(el.scrollHeight > el.clientHeight + 1);
  }, [expanded]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return (
    <div className={className}>
      <div className="relative">
        <div
          id={id}
          ref={textRef}
          data-collapsed={!expanded}
          className={expanded ? undefined : collapsedClassName}
        >
          {children}
        </div>
        {!expanded && isCut && (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute bottom-0 md:hidden ${fadeClassName}`}
          />
        )}
      </div>
      {isCut && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => {
            // Only expanding is counted: it shows whether shoppers read on.
            if (!expanded && analyticsId) {
              sendGAEvent("event", analyticsEvent, {
                content_type: analyticsContentType,
                content_id: analyticsId,
              });
            }
            setExpanded(!expanded);
          }}
          className="md:hidden inline-flex min-h-9 items-center text-sm text-[#7A5C36] underline underline-offset-2"
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      )}
    </div>
  );
}
