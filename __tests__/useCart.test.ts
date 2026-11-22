import { describe, it, expect, beforeEach, vi } from "vitest";

const item = { productId: "p1", name: "Шампунь", price: 950, image: "", quantity: 2 };

// The store reads localStorage once, when its module loads — so each test
// prepares the storage first and then loads a fresh copy of the module.
async function loadCart() {
  vi.resetModules();
  const { useCart } = await import("@/hooks/useCart");
  return useCart;
}

describe("useCart — що кошик пам'ятає між візитами", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("повертає товари, але ніколи не відкривається сам", async () => {
    // Так виглядає запис, який лишила стара версія: кошик був відкритий, коли
    // людина пішла зі сторінки. Раніше він виїжджав поверх наступної сторінки.
    localStorage.setItem(
      "viola-cart",
      JSON.stringify({ state: { items: [item], isOpen: true }, version: 0 }),
    );

    const useCart = await loadCart();

    expect(useCart.getState().items).toEqual([item]);
    expect(useCart.getState().isOpen).toBe(false);
  });

  it("зберігає лише вміст, без стану «відкрито»", async () => {
    const useCart = await loadCart();

    useCart.getState().addItem(item);
    useCart.getState().openCart();

    const saved = JSON.parse(localStorage.getItem("viola-cart") ?? "{}");
    expect(saved.state).toEqual({ items: [item] });
  });

  it("порожнє сховище — порожній закритий кошик", async () => {
    const useCart = await loadCart();

    expect(useCart.getState().items).toEqual([]);
    expect(useCart.getState().isOpen).toBe(false);
  });
});
