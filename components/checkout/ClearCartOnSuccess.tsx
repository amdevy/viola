"use client";

import { useEffect } from "react";
import { sendGAEvent } from "@next/third-parties/google";
import { useCart } from "@/hooks/useCart";

export default function ClearCartOnSuccess({
  orderId,
  isPaid = false,
}: {
  orderId?: string;
  isPaid?: boolean;
}) {
  const items = useCart((s) => s.items);
  const clearCart = useCart((s) => s.clearCart);

  useEffect(() => {
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
  }, [orderId, isPaid, items, clearCart]);

  return null;
}
