"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem } from "@/types";

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

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

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      total: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "viola-cart",
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
