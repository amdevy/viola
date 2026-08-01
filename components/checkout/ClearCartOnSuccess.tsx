"use client";

import { useEffect, useRef } from "react";
import { sendGAEvent } from "@next/third-parties/google";
import { useCart } from "@/hooks/useCart";

export default function ClearCartOnSuccess({
  orderId,
  isPaid = false,
}: {
  orderId?: string;
  isPaid?: boolean;
}) {
  const clearCart = useCart((s) => s.clearCart);
  // The cart is read imperatively rather than subscribed to. Selecting `items`
  // here re-rendered this component the instant the cart was cleared, and since
  // the effect depended on `items` it cleared again, re-rendered again, and took
  // the whole success page down with React #185 (max update depth) — so the
  // shopper saw "This page couldn't load" right after a successful order.
  const fired = useRef(false);

  useEffect(() => {
    // StrictMode mounts effects twice in development; without this the purchase
    // event would be reported to GA twice for one order.
    if (fired.current) return;
    fired.current = true;

    const items = useCart.getState().items;

    if (items.length > 0 && orderId) {
      const value = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const gaItems = items.map((i) => ({
        item_id: i.productId,
        item_name: i.name,
        price: i.price,
        quantity: i.quantity,
      }));

      // Only money actually collected counts as a purchase. "Call me back" is
      // the default payment method, so counting those inflates reported revenue
      // permanently — they are leads until the owner confirms and charges them.
      if (isPaid) {
        sendGAEvent("event", "purchase", {
          transaction_id: orderId,
          value,
          currency: "UAH",
          shipping: 0,
          tax: 0,
          items: gaItems,
        });
      } else {
        sendGAEvent("event", "generate_lead", {
          transaction_id: orderId,
          value,
          currency: "UAH",
          items: gaItems,
        });
      }
    }
    clearCart();
  }, [orderId, isPaid, clearCart]);

  return null;
}
