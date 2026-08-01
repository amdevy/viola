import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useCardPaymentUnlock } from "@/hooks/useCardPaymentUnlock";

const tap = () => useCardPaymentUnlock.getState().tap();
const unlocked = () => useCardPaymentUnlock.getState().unlocked;

describe("useCardPaymentUnlock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-01T12:00:00Z"));
    useCardPaymentUnlock.setState({ unlocked: false, taps: 0, lastTapAt: 0 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("за замовчуванням заблоковано", () => {
    expect(unlocked()).toBe(false);
  });

  it("дев'ять швидких натискань не розблоковують", () => {
    for (let i = 0; i < 9; i++) {
      expect(tap()).toBe(false);
      vi.advanceTimersByTime(200);
    }
    expect(unlocked()).toBe(false);
  });

  it("десяте швидке натискання розблоковує", () => {
    for (let i = 0; i < 9; i++) {
      tap();
      vi.advanceTimersByTime(200);
    }
    expect(tap()).toBe(true);
    expect(unlocked()).toBe(true);
  });

  it("пауза обнуляє лічильник — потрібно без перестанку", () => {
    for (let i = 0; i < 9; i++) {
      tap();
      vi.advanceTimersByTime(200);
    }
    // Задовга пауза: серія починається спочатку.
    vi.advanceTimersByTime(2000);
    expect(tap()).toBe(false);
    expect(unlocked()).toBe(false);

    // Після паузи це було перше натискання, тож потрібні ще дев'ять.
    for (let i = 0; i < 8; i++) {
      vi.advanceTimersByTime(200);
      expect(tap()).toBe(false);
    }
    vi.advanceTimersByTime(200);
    expect(tap()).toBe(true);
    expect(unlocked()).toBe(true);
  });

  it("після розблокування подальші натискання нічого не змінюють", () => {
    useCardPaymentUnlock.setState({ unlocked: true });
    expect(tap()).toBe(false);
    expect(unlocked()).toBe(true);
  });

  it("lock() повертає стан назад", () => {
    useCardPaymentUnlock.setState({ unlocked: true });
    useCardPaymentUnlock.getState().lock();
    expect(unlocked()).toBe(false);
  });
});
