import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import ClearCartOnSuccess from "@/components/checkout/ClearCartOnSuccess";
import { useCart } from "@/hooks/useCart";
import { sendGAEvent } from "@next/third-parties/google";

vi.mock("@next/third-parties/google", () => ({
  sendGAEvent: vi.fn(),
}));

const ITEM = {
  productId: "p1",
  name: "Шампунь Harmony",
  price: 450,
  image: "/img.jpg",
  quantity: 2,
};

describe("ClearCartOnSuccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCart.setState({ items: [ITEM] });
  });

  it("очищає кошик рівно один раз", async () => {
    const clearSpy = vi.spyOn(useCart.getState(), "clearCart");
    render(<ClearCartOnSuccess orderId="order-1" isPaid />);

    await waitFor(() => expect(useCart.getState().items).toHaveLength(0));
    expect(clearSpy).toHaveBeenCalledTimes(1);
  });

  it("не входить у нескінченний цикл оновлень (React #185)", async () => {
    // The regression: the effect depended on `items` while clearing them, so
    // every clear produced a fresh array, re-ran the effect, and blew the update
    // depth — the success page died with "This page couldn't load".
    const clearSpy = vi.spyOn(useCart.getState(), "clearCart");
    render(<ClearCartOnSuccess orderId="order-1" isPaid />);

    await waitFor(() => expect(useCart.getState().items).toHaveLength(0));
    // Give any runaway effect loop a chance to actually run away.
    await new Promise((r) => setTimeout(r, 100));

    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(sendGAEvent).toHaveBeenCalledTimes(1);
  });

  it("оплачене замовлення — це purchase", async () => {
    render(<ClearCartOnSuccess orderId="order-1" isPaid />);
    await waitFor(() =>
      expect(sendGAEvent).toHaveBeenCalledWith(
        "event",
        "purchase",
        expect.objectContaining({ transaction_id: "order-1", value: 900, currency: "UAH" })
      )
    );
  });

  it("заявка на дзвінок — це лід, а не продаж", async () => {
    render(<ClearCartOnSuccess orderId="order-1" isPaid={false} />);
    await waitFor(() =>
      expect(sendGAEvent).toHaveBeenCalledWith(
        "event",
        "generate_lead",
        expect.objectContaining({ transaction_id: "order-1", value: 900 })
      )
    );
    expect(sendGAEvent).not.toHaveBeenCalledWith("event", "purchase", expect.anything());
  });

  it("порожній кошик не породжує події аналітики", async () => {
    useCart.setState({ items: [] });
    render(<ClearCartOnSuccess orderId="order-1" isPaid />);
    await new Promise((r) => setTimeout(r, 50));
    expect(sendGAEvent).not.toHaveBeenCalled();
  });

  it("clearCart на порожньому кошику не створює нового масиву", () => {
    useCart.setState({ items: [] });
    const before = useCart.getState().items;
    useCart.getState().clearCart();
    // Same reference — otherwise every subscriber re-renders for nothing, which
    // is exactly what fed the loop.
    expect(useCart.getState().items).toBe(before);
  });
});
