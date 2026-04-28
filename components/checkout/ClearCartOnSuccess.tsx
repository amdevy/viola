"use client";

import { useEffect } from "react";
import { useCart } from "@/hooks/useCart";

export default function ClearCartOnSuccess() {
  const clearCart = useCart((s) => s.clearCart);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return null;
}
