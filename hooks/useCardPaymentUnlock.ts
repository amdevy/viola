"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Card payment is hidden from shoppers until production LiqPay keys are in
// place — a sandbox key would mark orders paid with no money received.
// It can still be reached for testing by tapping the "Разом" total ten times in
// quick succession. Deliberately undiscoverable rather than secret: it only
// reveals a payment option, and the server refuses sandbox keys in production
// anyway (assertLiqPayEnv), so this cannot be used to take a fake payment.
//
// To ship card payment to everyone, delete this hook and the `unlocked` check
// in OrderForm.

const REQUIRED_TAPS = 10;
/** Taps further apart than this restart the count — "without stopping". */
const MAX_GAP_MS = 1200;

type CardPaymentUnlockState = {
  unlocked: boolean;
  taps: number;
  lastTapAt: number;
  /** Returns true when this tap completed the sequence. */
  tap: () => boolean;
  lock: () => void;
};

export const useCardPaymentUnlock = create<CardPaymentUnlockState>()(
  persist(
    (set, get) => ({
      unlocked: false,
      taps: 0,
      lastTapAt: 0,

      tap: () => {
        const { unlocked, taps, lastTapAt } = get();
        if (unlocked) return false;

        const now = Date.now();
        const streak = now - lastTapAt <= MAX_GAP_MS ? taps + 1 : 1;

        if (streak >= REQUIRED_TAPS) {
          set({ unlocked: true, taps: 0, lastTapAt: 0 });
          return true;
        }

        set({ taps: streak, lastTapAt: now });
        return false;
      },

      lock: () => set({ unlocked: false, taps: 0, lastTapAt: 0 }),
    }),
    {
      name: "viola-card-unlock",
      // sessionStorage: survives the LiqPay redirect back into the same tab,
      // but a new visit starts locked again.
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? (undefined as never) : window.sessionStorage
      ),
      partialize: (s) => ({ unlocked: s.unlocked }) as CardPaymentUnlockState,
    }
  )
);
