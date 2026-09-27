/**
 * Google Analytics without the load-order gap.
 *
 * @next/third-parties' <GoogleAnalytics> injects gtag's setup after hydration,
 * and its sendGAEvent drops any event sent before that — the console says
 * "GA dataLayer dataLayer does not exist" and the event is gone. Mount effects
 * run before that point, so on every full page load we lost view_item,
 * view_item_list and, worst of all, purchase: the success page after the
 * LiqPay redirect is always a full load, reports the order on mount and then
 * clears the cart, so there was no second chance.
 *
 * The setup now runs as Google's own snippet in <head> (see gaInitScript and
 * the locale layout), before any React code, so the dataLayer exists and
 * `config` precedes every event.
 */

/** The inline part of Google's gtag snippet: queue, clock, config. */
export function gaInitScript(gaId: string): string {
  return [
    "window.dataLayer=window.dataLayer||[];",
    "function gtag(){dataLayer.push(arguments);}",
    "gtag('js',new Date());",
    `gtag('config',${JSON.stringify(gaId)});`,
  ].join("");
}

type DataLayerWindow = Window & { dataLayer?: unknown[] };

/**
 * Same call shape as gtag and as the @next/third-parties helper it replaces:
 * sendGAEvent("event", "purchase", { ... }).
 *
 * gtag only reads the `arguments` object — an array pushed to the dataLayer is
 * a different kind of message — so this pushes `arguments`, not `args`.
 */
export function sendGAEvent(...args: unknown[]): void;
export function sendGAEvent(): void {
  if (typeof window === "undefined") return;
  // No dataLayer means GA is switched off (no NEXT_PUBLIC_GA_ID): nothing to report to.
  // eslint-disable-next-line prefer-rest-params
  (window as DataLayerWindow).dataLayer?.push(arguments);
}
