/**
 * The checkout form's draft, kept for the tab so that leaving /checkout (a
 * recommended product, a language switch, a reload after a trip to the bank
 * app) does not wipe what the shopper typed.
 *
 * sessionStorage on purpose: it ends with the tab, so a name and a phone
 * number do not linger on a shared computer. `acceptOffer` is never stored —
 * accepting the offer is a consent stamped on the order and is given anew
 * each time.
 *
 * Every read is defensive: no storage, a throwing storage (private mode,
 * blocked site data), malformed JSON or a wrong shape all mean "no draft".
 * Browser-only — call from effects, handlers or client snapshots.
 */

const KEY = "viola:checkout-draft";

export interface CheckoutDraft {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  notes: string;
  paymentMethod: "card" | "callback";
  city: string;
  cityRef: string;
  novaPoshtaRef: string;
  novaPoshtaAddress: string;
}

const TEXT_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "email",
  "notes",
  "city",
  "cityRef",
  "novaPoshtaRef",
  "novaPoshtaAddress",
] as const;

/**
 * What the shopper actually filled in: the text fields they see, with the
 * delivery city and branch counted once each. The payment method always has a
 * value, so it does not count.
 */
export function filledFieldCount(draft: CheckoutDraft): number {
  const visible = [
    draft.firstName,
    draft.lastName,
    draft.phone,
    draft.email,
    draft.notes,
    draft.city,
    draft.novaPoshtaRef,
  ];
  return visible.filter((v) => v.trim() !== "").length;
}

function parse(raw: string | null): CheckoutDraft | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const record = data as Record<string, unknown>;

  const draft = { paymentMethod: "callback" } as CheckoutDraft;
  for (const field of TEXT_FIELDS) {
    const value = record[field] ?? "";
    if (typeof value !== "string") return null;
    draft[field] = value;
  }
  const method = record.paymentMethod;
  if (method !== "card" && method !== "callback") return null;
  draft.paymentMethod = method;

  return filledFieldCount(draft) > 0 ? draft : null;
}

/** Only the draft's own fields: whatever else a caller passes is not stored. */
function pick(draft: CheckoutDraft): CheckoutDraft {
  const out = { paymentMethod: draft.paymentMethod } as CheckoutDraft;
  for (const field of TEXT_FIELDS) out[field] = draft[field];
  return out;
}

export function readCheckoutDraft(): CheckoutDraft | null {
  try {
    return parse(window.sessionStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function writeCheckoutDraft(draft: CheckoutDraft): void {
  try {
    if (filledFieldCount(draft) === 0) window.sessionStorage.removeItem(KEY);
    else window.sessionStorage.setItem(KEY, JSON.stringify(pick(draft)));
  } catch {
    // Nothing to keep then; the form still works.
  }
}

export function clearCheckoutDraft(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // Same as above.
  }
}
