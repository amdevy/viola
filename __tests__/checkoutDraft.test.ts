import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  clearCheckoutDraft,
  filledFieldCount,
  readCheckoutDraft,
  writeCheckoutDraft,
  type CheckoutDraft,
} from "@/lib/checkout-draft";

const KEY = "viola:checkout-draft";

const DRAFT: CheckoutDraft = {
  firstName: "Олена",
  lastName: "Іваненко",
  phone: "050 123 45 67",
  email: "",
  notes: "",
  paymentMethod: "callback",
  city: "Київ",
  cityRef: "kyiv-ref",
  novaPoshtaRef: "wh-1",
  novaPoshtaAddress: "Відділення №1",
};

describe("checkout-draft — чернетка форми замовлення", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("зберігає й читає чернетку в sessionStorage", () => {
    writeCheckoutDraft(DRAFT);
    expect(JSON.parse(sessionStorage.getItem(KEY)!)).toEqual(DRAFT);
    expect(readCheckoutDraft()).toEqual(DRAFT);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("ніколи не зберігає згоду з офертою", () => {
    writeCheckoutDraft({ ...DRAFT, acceptOffer: true } as unknown as CheckoutDraft);
    expect(JSON.parse(sessionStorage.getItem(KEY)!)).not.toHaveProperty("acceptOffer");
    expect(readCheckoutDraft()).not.toHaveProperty("acceptOffer");
  });

  it("порожня форма нічого не лишає", () => {
    writeCheckoutDraft(DRAFT);
    writeCheckoutDraft({ ...DRAFT, firstName: "", lastName: "", phone: "", city: "", cityRef: "", novaPoshtaRef: "", novaPoshtaAddress: "" });
    expect(sessionStorage.getItem(KEY)).toBeNull();
    expect(readCheckoutDraft()).toBeNull();
  });

  it("зіпсований вміст — це «чернетки немає», а не падіння", () => {
    for (const raw of [
      "{not json",
      "null",
      "42",
      "[]",
      JSON.stringify({ ...DRAFT, phone: 123 }),
      JSON.stringify({ ...DRAFT, paymentMethod: "cash" }),
    ]) {
      sessionStorage.setItem(KEY, raw);
      expect(readCheckoutDraft()).toBeNull();
    }
  });

  it("сховище недоступне — читання дає null, запис і очищення не падають", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });

    expect(readCheckoutDraft()).toBeNull();
    expect(() => writeCheckoutDraft(DRAFT)).not.toThrow();
    expect(() => clearCheckoutDraft()).not.toThrow();
  });

  it("рахує лише заповнені поля, місто й відділення — по одному", () => {
    expect(filledFieldCount(DRAFT)).toBe(5);
  });

  it("clearCheckoutDraft прибирає чернетку", () => {
    writeCheckoutDraft(DRAFT);
    clearCheckoutDraft();
    expect(readCheckoutDraft()).toBeNull();
  });
});
