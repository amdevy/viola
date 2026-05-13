"use client";

import { useEffect } from "react";
import { sendGAEvent } from "@next/third-parties/google";
import { useCart } from "@/hooks/useCart";

export default function ClearCartOnSuccess({ orderId }: { orderId?: string }) {
  const items = useCart((s) => s.items);
  const clearCart = useCart((s) => s.clearCart);

  useEffect(() => {
    if (items.length > 0 && orderId) {
      const value = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      sendGAEvent("event", "purchase", {
        transaction_id: orderId,
        value,
        currency: "UAH",
        shipping: 0,
        tax: 0,
        items: items.map((i) => ({
          item_id: i.productId,
          item_name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      });
    }
    clearCart();
  }, [orderId, items, clearCart]);

  return null;
}
