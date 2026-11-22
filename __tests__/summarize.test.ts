import { describe, it, expect } from "vitest";
import { summarize } from "@/lib/utils";

describe("summarize — початок опису для короткого перегляду", () => {
  it("короткий текст лишає як є, лише зводить пробіли й абзаци в один рядок", () => {
    expect(summarize("Шампунь  очищує.\n\nБетаїн зволожує.")).toBe("Шампунь очищує. Бетаїн зволожує.");
    expect(summarize(null)).toBe("");
    expect(summarize(undefined)).toBe("");
  });

  it("довгий текст обрізає на кінці речення", () => {
    const text = "Перше речення про маску. Друге речення трохи довше за перше. Третє вже не вміщається в ліміт.";
    expect(summarize(text, 70)).toBe("Перше речення про маску. Друге речення трохи довше за перше.");
  });

  it("якщо речення не закінчується вчасно — ріже по слову й ставить три крапки", () => {
    const text = "Маска з синергетичною комбінацією семи зволожувальних компонентів для сухого волосся";
    const short = summarize(text, 40);
    expect(short.endsWith("…")).toBe(true);
    expect(short.length).toBeLessThanOrEqual(41);
    expect(text.startsWith(short.slice(0, -1))).toBe(true);
    // Не рве слово посередині.
    expect(text[short.length - 1]).toBe(" ");
  });
});
