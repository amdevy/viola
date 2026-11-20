import { describe, it, expect } from "vitest";
import { lastModified, TEMPLATE_UPDATED } from "@/lib/seo-freshness";

describe("lastModified", () => {
  it("без даних повертає дату шаблону", () => {
    expect(lastModified("category")).toEqual(new Date(TEMPLATE_UPDATED.category));
  });

  it("стара дата з бази не відкидає сторінку назад", () => {
    // Саме це й було зламано: created_at категорії (березень) стояв у sitemap
    // як lastmod, хоча сторінку переписали у вересні.
    expect(lastModified("category", "2026-03-07T10:00:00Z")).toEqual(
      new Date(TEMPLATE_UPDATED.category),
    );
  });

  it("новіший товар пересуває дату вперед", () => {
    const newer = "2099-01-01T00:00:00Z";
    expect(lastModified("category", "2026-03-07T10:00:00Z", newer)).toEqual(new Date(newer));
  });

  it("порожні й биті значення ігнорує", () => {
    expect(lastModified("product", null, undefined, "", "не дата")).toEqual(
      new Date(TEMPLATE_UPDATED.product),
    );
  });

  it("приймає Date", () => {
    const newer = new Date("2099-06-01T00:00:00Z");
    expect(lastModified("shop", newer)).toEqual(newer);
  });
});

describe("TEMPLATE_UPDATED", () => {
  it("кожна дата — справжня дата у форматі РРРР-ММ-ДД", () => {
    for (const [name, value] of Object.entries(TEMPLATE_UPDATED)) {
      expect(value, name).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(new Date(value).getTime()), name).toBe(false);
    }
  });
});
