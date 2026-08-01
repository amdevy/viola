import crypto from "crypto";

export type LiqPayParams = {
  public_key: string;
  version: 3;
  action: "pay" | "hold" | "subscribe" | "paydonate" | "auth";
  amount: number;
  currency: "UAH" | "USD" | "EUR";
  description: string;
  order_id: string;
  result_url?: string;
  server_url?: string;
  language?: "uk" | "en";
  sandbox?: 0 | 1;
};

// Statuses where LiqPay has settled the money and the order may be fulfilled.
// "sandbox" is only ever returned in test mode — accepted so sandbox runs are
// testable, and separately refused in production by assertLiqPayEnv().
// "wait_accept" is deliberately NOT here: the funds are held and returned to
// the payer if the merchant is not verified, so it is not money in hand.
export const LIQPAY_PAID_STATUSES = new Set(["success", "sandbox"]);

// Only these mean the payment is definitively dead. EVERYTHING else that is not
// paid is treated as still in flight.
//
// The allowlist runs this way round on purpose. LiqPay's status vocabulary is
// long and grows (senderapp_verify, password_verify, wait_compensation, …), and
// an unknown status must never reach the failure screen: that screen offers a
// retry button, and retrying a payment the bank is still confirming is how one
// purchase becomes two charges. An unknown status shown as "still processing"
// costs a customer some waiting; shown as "failed" it costs them money.
export const LIQPAY_FAILED_STATUSES = new Set([
  "failure",
  "error",
  "reversed",
  "expired",
  "unsubscribed",
]);

export function isPaidStatus(status: string): boolean {
  return LIQPAY_PAID_STATUSES.has(status);
}

export function isTerminalFailure(status: string): boolean {
  return LIQPAY_FAILED_STATUSES.has(status);
}

/** Not paid, not definitively failed — the money may still be moving. */
export function isInFlight(status: string): boolean {
  return !isPaidStatus(status) && !isTerminalFailure(status);
}

// Statuses where LiqPay has already debited the payer but the funds are held
// (merchant verification, manual review). The customer has paid; the shop has
// not been credited. Worth telling the owner about rather than silently waiting.
export const LIQPAY_HELD_STATUSES = new Set([
  "wait_accept",
  "wait_compensation",
  "hold_wait",
  "wait_lc",
  "wait_reserve",
]);

export function isSandboxKey(publicKey: string | undefined): boolean {
  return Boolean(publicKey?.startsWith("sandbox_"));
}

/**
 * Opt-in hatch for exercising the card flow on the live domain before real
 * LiqPay credentials exist.
 *
 * Deliberately an env var and not a code default: a sandbox payment settles the
 * order as paid without any money moving, so enabling it has to be an explicit
 * act by whoever controls the host, and undoing it is deleting one variable.
 * Orders paid this way are marked payment_status='sandbox' and are announced to
 * Telegram as tests, so they can never be mistaken for revenue.
 */
export function sandboxAllowedInProduction(): boolean {
  return process.env.LIQPAY_ALLOW_SANDBOX === "1";
}

/**
 * Guards the one misconfiguration that silently gives goods away: shipping with
 * sandbox keys marks every card order paid while no money moves. Throws rather
 * than degrading, so the failure is loud at the first card checkout.
 */
export function assertLiqPayEnv(): { publicKey: string; privateKey: string; siteUrl: string } {
  const publicKey = process.env.LIQPAY_PUBLIC_KEY;
  const privateKey = process.env.LIQPAY_PRIVATE_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!publicKey || !privateKey) {
    throw new Error("LIQPAY_PUBLIC_KEY / LIQPAY_PRIVATE_KEY are not configured");
  }
  if (!siteUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL is not configured");
  }
  if (process.env.NODE_ENV === "production") {
    if (isSandboxKey(publicKey)) {
      if (!sandboxAllowedInProduction()) {
        throw new Error(
          "Refusing to take card payments in production with sandbox LiqPay keys — orders would be marked paid with no money received. Set LIQPAY_ALLOW_SANDBOX=1 to test deliberately."
        );
      }
      // Logged on every single checkout, not once at boot: this is a state the
      // shop must not be left in, and a line that scrolls past in the deploy
      // log is a line nobody sees again.
      console.warn(
        "LiqPay: SANDBOX keys accepted in production because LIQPAY_ALLOW_SANDBOX=1 — card orders will settle as paid with NO money received. Remove this variable once real keys are configured."
      );
    }
    if (siteUrl.startsWith("http://") || siteUrl.includes("localhost")) {
      throw new Error(
        `NEXT_PUBLIC_SITE_URL must be the public https origin in production (got "${siteUrl}") — LiqPay cannot deliver the callback otherwise`
      );
    }
  }

  return { publicKey, privateKey, siteUrl: siteUrl.replace(/\/$/, "") };
}

export function encodeData(params: LiqPayParams): string {
  return Buffer.from(JSON.stringify(params)).toString("base64");
}

export function makeSignature(data: string, privateKey: string): string {
  return crypto
    .createHash("sha1")
    .update(privateKey + data + privateKey)
    .digest("base64");
}

export function buildCheckout(params: LiqPayParams, privateKey: string) {
  const data = encodeData(params);
  const signature = makeSignature(data, privateKey);
  return { data, signature };
}

export function verifyCallback(data: string, signature: string, privateKey: string): boolean {
  const expected = makeSignature(data, privateKey);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function decodeCallback<T = Record<string, unknown>>(data: string): T {
  return JSON.parse(Buffer.from(data, "base64").toString("utf-8")) as T;
}

/**
 * True when LiqPay captured what we asked for. Guards against a checkout that
 * was signed for a different amount than the order is worth.
 */
export function amountMatches(paid: unknown, expected: number): boolean {
  const value = Number(paid);
  if (!Number.isFinite(value)) return false;
  return Math.abs(value - expected) < 0.01;
}

export type LiqPayStatusResponse = {
  status: string;
  order_id: string;
  payment_id?: number;
  amount?: number;
  currency?: string;
  err_code?: string;
  err_description?: string;
};

export async function fetchLiqPayStatus(
  orderId: string,
  publicKey: string,
  privateKey: string,
  timeoutMs = 4000
): Promise<LiqPayStatusResponse> {
  const params = {
    action: "status",
    version: 3,
    public_key: publicKey,
    order_id: orderId,
  };
  const data = Buffer.from(JSON.stringify(params)).toString("base64");
  const signature = makeSignature(data, privateKey);

  const body = new URLSearchParams({ data, signature });

  // Without a timeout a slow LiqPay hangs the success page until the platform
  // kills the invocation, so a customer who just paid gets a 504 and a full cart.
  const res = await fetch("https://www.liqpay.ua/api/request", {
    method: "POST",
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });

  return (await res.json()) as LiqPayStatusResponse;
}
