"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem } from "@/types";

/**
 * Where the cart was opened from. CartDrawer reports it as `method` on its one
 * `view_cart` per opening, so GA shows which ways to the cart are used.
 */
export type CartOpenMethod =
  | "toast"
  | "bottom_nav"
  | "header"
  | "search"
  | "product_page"
  | "sticky_bar";

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  /** How the open cart was opened; null while closed or when not said. */
  openMethod: CartOpenMethod | null;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  openCart: (method?: CartOpenMethod) => void;
  closeCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      openMethod: null,

      addItem: (newItem) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === newItem.productId
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === newItem.productId
                  ? { ...i, quantity: i.quantity + newItem.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      updateQuantity: (productId, qty) => {
        if (qty <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity: qty } : i
          ),
        }));
      },

      // Returning the current state unchanged makes zustand skip the update
      // entirely. `set({ items: [] })` allocated a fresh array on every call, so
      // clearing an already-empty cart still notified every subscriber with a
      // new reference — enough to spin any effect that depends on `items`.
      clearCart: () =>
        set((state) => (state.items.length === 0 ? state : { ...state, items: [] })),

      openCart: (method) => set({ isOpen: true, openMethod: method ?? null }),
      closeCart: () => set({ isOpen: false, openMethod: null }),

      total: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "viola-cart",
      // Only the contents are remembered between visits. `isOpen` used to be
      // saved too, so a page loaded after the cart had been left open — a
      // reload, a link opened from the cart — greeted the shopper with the cart
      // sliding over it. `merge` also drops an `isOpen` saved by the old code.
      partialize: (state) => ({ items: state.items }),
      merge: (persisted, current) => ({
        ...current,
        items: (persisted as { items?: CartItem[] } | undefined)?.items ?? current.items,
      }),
      storage: createJSONStorage(() => ({
        getItem: (key) => {
          try { return localStorage.getItem(key); }
          catch { return null; }
        },
        setItem: (key, value) => {
          try { localStorage.setItem(key, value); }
          catch { /* ignore */ }
        },
        removeItem: (key) => {
          try { localStorage.removeItem(key); }
          catch { /* ignore */ }
        },
      })),
    }
  )
);
