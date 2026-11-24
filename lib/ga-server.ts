import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * GA4 `purchase` for paid card orders, sent from the server.
 *
 * The browser can only report a purchase on /checkout/success, after LiqPay
 * sends the shopper back. Many shoppers pay and close the LiqPay page, so GA
 * never heard of those sales. The LiqPay callback now reports them through the
 * Measurement Protocol, using the GA client/session ids that /api/orders read
 * from the shopper's cookies when the order was placed.
 *
 * One reporter per order. Google documents purchase deduplication by
 * transaction_id only in general terms and says nothing about a Measurement
 * Protocol event meeting a gtag one, so we do not rely on it: whoever reports
 * first claims the order (orders.ga_purchase_sent_at, compare-and-set) and the
 * other side stays silent. The server is preferred; the success page falls
 * back to the browser event only when the server cannot report (no API secret,
 * no client id, sandbox payment, migration 015 not run, GA unreachable).
 *
 * Nothing here throws: GA being down must never fail a LiqPay callback or the
 * success page.
 */

const MP_ENDPOINT = "https://www.google-analytics.com/mp/collect";
const MP_TIMEOUT_MS = 4000;
// Measurement Protocol limit for a standard property.
const MAX_PARAM_LENGTH = 100;

const SESSION_ID_RE = /^\d{1,20}$/;

/**
 * `_ga` holds `GA1.<domain depth>.<random>.<first visit, unix seconds>`; the
 * client id gtag sends is the last two parts, e.g. GA1.1.123456789.1764000000
 * → "123456789.1764000000".
 */
export function parseGaClientId(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = /^GA\d+\.\d+\.(\d{1,20}\.\d{1,20})$/.exec(value.trim());
  return match ? match[1] : null;
}

/** Measurement id G-ABC123 → session cookie name `_ga_ABC123`. */
export function gaSessionCookieName(measurementId: string | null | undefined): string | null {
  if (!measurementId) return null;
  const match = /^G-([A-Z0-9]+)$/i.exec(measurementId.trim());
  return match ? `_ga_${match[1]}` : null;
}

/**
 * Session id from the `_ga_<stream>` cookie. Google does not document the
 * value, and changed it in 2025, so both layouts are read and anything else is
 * ignored (the purchase is then sent without a session id):
 *   GS1.1.1746825440.14.0.1746825490.0.0.0      — session id is the 3rd field
 *   GS2.1.s1746825440$o14$g0$t1746825490$j0$l0$h0 — session id is the `s` segment
 */
export function parseGaSessionId(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim();

  const gs2 = /^GS2\.\d+\.(.+)$/.exec(v);
  if (gs2) {
    const segment = gs2[1].split("$").find((s) => /^s\d+$/.test(s));
    const id = segment?.slice(1);
    return id && SESSION_ID_RE.test(id) ? id : null;
  }

  const gs1 = /^GS1\.\d+\.([^.]+)\./.exec(v);
  if (gs1) return SESSION_ID_RE.test(gs1[1]) ? gs1[1] : null;

  return null;
}

type CookieReader = { get(name: string): { value: string } | undefined };

/** GA ids of the shopper placing an order, from the cookies gtag set. */
export function readGaIds(
  cookies: CookieReader,
  measurementId: string | undefined = process.env.NEXT_PUBLIC_GA_ID
): { clientId: string | null; sessionId: string | null } {
  const clientId = parseGaClientId(cookies.get("_ga")?.value);
  const sessionCookie = gaSessionCookieName(measurementId);
  const sessionId =
    clientId && sessionCookie ? parseGaSessionId(cookies.get(sessionCookie)?.value) : null;
  return { clientId, sessionId };
}

export type ServerPurchaseResult =
  /** The Measurement Protocol accepted the purchase. */
  | "sent"
  /** Someone (server or browser) already reported this order. */
  | "already_reported"
  /** No API secret or measurement id: server reporting is switched off. */
  | "not_configured"
  /** Not a paid card order (or no such order). */
  | "not_paid"
  /** LiqPay test payment — not revenue, never sent from the server. */
  | "sandbox"
  /** The shopper's GA client id was not readable at checkout. */
  | "no_client_id"
  /** The order could not be read or claimed, e.g. migration 015 not run yet. */
  | "unavailable"
  /** GA could not be reached or refused the request; the claim was released. */
  | "failed";

type OrderForGA = {
  id: string;
  status: string;
  payment_type: string | null;
  payment_status: string | null;
  total: number | string;
  ga_client_id: string | null;
  ga_session_id: string | null;
  ga_purchase_sent_at: string | null;
  order_items:
    | {
        product_id: string | null;
        quantity: number;
        price: number | string;
        products: { name: string } | null;
      }[]
    | null;
};

const ORDER_COLUMNS =
  "id, status, payment_type, payment_status, total, ga_client_id, ga_session_id, ga_purchase_sent_at, order_items(product_id, quantity, price, products(name))";

function mpConfig(): { measurementId: string; apiSecret: string } | null {
  const measurementId = process.env.NEXT_PUBLIC_GA_ID?.trim();
  const apiSecret = process.env.GA_MEASUREMENT_PROTOCOL_SECRET?.trim();
  if (!measurementId || !apiSecret) return null;
  return { measurementId, apiSecret };
}

function db(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function purchasePayload(order: OrderForGA, clientId: string) {
  const items = (order.order_items ?? [])
    .map((i) => ({
      ...(i.product_id ? { item_id: i.product_id } : {}),
      ...(i.products?.name ? { item_name: i.products.name.slice(0, MAX_PARAM_LENGTH) } : {}),
      price: Number(i.price),
      quantity: i.quantity,
    }))
    // GA needs item_id or item_name to count an item.
    .filter((i) => "item_id" in i || "item_name" in i);

  return {
    client_id: clientId,
    events: [
      {
        name: "purchase",
        params: {
          // Same shape as the browser event in ClearCartOnSuccess.
          transaction_id: order.id,
          value: Number(order.total),
          currency: "UAH",
          shipping: 0,
          tax: 0,
          items,
          // Both are needed for the event to count in the shopper's session
          // (source/medium, engaged sessions, Realtime). The shopper spent the
          // time on LiqPay, not with us, so engagement is the minimum.
          ...(order.ga_session_id && SESSION_ID_RE.test(order.ga_session_id)
            ? { session_id: order.ga_session_id }
            : {}),
          engagement_time_msec: 1,
        },
      },
    ],
  };
}

async function releaseClaim(supabase: SupabaseClient, orderId: string) {
  const { error } = await supabase
    .from("orders")
    .update({ ga_purchase_sent_at: null, ga_purchase_sent_by: null })
    .eq("id", orderId)
    .eq("ga_purchase_sent_by", "server");
  if (error) console.error("ga: could not release purchase claim", orderId, error.message);
}

async function report(orderId: string): Promise<ServerPurchaseResult> {
  const config = mpConfig();
  const supabase = db();
  if (!config || !supabase) return "not_configured";

  const { data: order, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("id", orderId)
    .maybeSingle<OrderForGA>();

  if (error) {
    console.warn("ga: order read failed (migration 015 not run yet?)", orderId, error.message);
    return "unavailable";
  }
  if (!order) return "not_paid";
  if (order.ga_purchase_sent_at) return "already_reported";
  if (order.payment_type !== "card" || order.status === "pending" || order.status === "cancelled") {
    return "not_paid";
  }
  if (order.payment_status === "sandbox") return "sandbox";
  // Cookies blocked or GA blocked: the shopper chose not to be tracked, and a
  // made-up client id would only add a sale with no source to GA. Sales are
  // counted from the orders table anyway.
  if (!order.ga_client_id) return "no_client_id";

  // Claim first, send second: of two concurrent reporters (a repeated
  // callback, the success page) exactly one gets the row back.
  const { data: claimed, error: claimError } = await supabase
    .from("orders")
    .update({ ga_purchase_sent_at: new Date().toISOString(), ga_purchase_sent_by: "server" })
    .eq("id", orderId)
    .is("ga_purchase_sent_at", null)
    .select("id");

  if (claimError) {
    console.warn("ga: purchase claim failed", orderId, claimError.message);
    return "unavailable";
  }
  if ((claimed?.length ?? 0) !== 1) return "already_reported";

  const url =
    `${MP_ENDPOINT}?measurement_id=${encodeURIComponent(config.measurementId)}` +
    `&api_secret=${encodeURIComponent(config.apiSecret)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(purchasePayload(order, order.ga_client_id)),
      signal: AbortSignal.timeout(MP_TIMEOUT_MS),
    });
    // The Measurement Protocol answers 2xx to anything it received, valid or
    // not; anything else means the request itself did not get through.
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return "sent";
  } catch (err) {
    console.error("ga: Measurement Protocol purchase failed", orderId, err);
    // Give the success page a chance to report it from the browser instead.
    await releaseClaim(supabase, orderId);
    return "failed";
  }
}

/**
 * Sends `purchase` for a paid card order through the Measurement Protocol,
 * at most once per order. Safe to call repeatedly and concurrently.
 */
export async function reportPurchaseFromServer(orderId: string): Promise<ServerPurchaseResult> {
  try {
    return await report(orderId);
  } catch (err) {
    console.error("ga: purchase report threw", orderId, err);
    return "unavailable";
  }
}

/**
 * For the success page of a paid order: true when the browser should send
 * `purchase` itself. The server goes first; if it has (or already had) the
 * order, the browser stays silent. Otherwise the browser claims the order so
 * a later callback cannot send it a second time.
 */
export async function browserShouldReportPurchase(orderId: string): Promise<boolean> {
  const server = await reportPurchaseFromServer(orderId);
  if (server === "sent" || server === "already_reported") return false;

  const supabase = db();
  if (!supabase) return true;
  try {
    const { data, error } = await supabase
      .from("orders")
      .update({ ga_purchase_sent_at: new Date().toISOString(), ga_purchase_sent_by: "browser" })
      .eq("id", orderId)
      .is("ga_purchase_sent_at", null)
      .select("id");
    // Before migration 015 there is nothing to claim: report from the browser,
    // exactly as before server-side reporting existed.
    if (error) return true;
    return (data?.length ?? 0) === 1;
  } catch {
    return true;
  }
}
