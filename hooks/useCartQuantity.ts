"use client";

import { useSyncExternalStore } from "react";
import { useCart } from "@/hooks/useCart";

const subscribeNever = () => () => {};

/**
 * False on the server and during hydration, true afterwards. The cart lives in
 * localStorage, so anything drawn from it must wait for this — otherwise the
 * first client render would not match the server's HTML.
 */
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}

/** How many of this product are in the cart; 0 until the page has hydrated. */
export function useCartQuantity(productId: string): number {
  const quantity = useCart(
    (s) => s.items.find((i) => i.productId === productId)?.quantity ?? 0,
  );
  return useHasMounted() ? quantity : 0;
}
