import { describe, it, expect } from "vitest";
import { getCategorySeo } from "@/lib/category-seo";

/**
 * Категорії, які продають товар і тому мусять мати довгий текст.
 *
 * Це і є суть тесту: сторінка категорії без цього блоку виглядає так само, але
 * ранжується інакше — саме на цьому кондиціонери втрачали 80% входів проти 38%
 * у шампунів. Додали категорію з товарами — або пишіть текст, або свідомо
 * додавайте її сюди у виняток.
 */
const CATEGORIES_WITH_COPY = ["shampoos", "conditioners", "masks", "leave-in"] as const;
const LOCALES = ["uk", "en"] as const;

describe("довгий SEO-текст категорій", () => {
  for (const slug of CATEGORIES_WITH_COPY) {
    for (const locale of LOCALES) {
      it(`${slug} / ${locale}: має розділи й FAQ`, () => {
        const seo = getCategorySeo(slug, locale);
        expect(seo, `немає запису для ${slug}/${locale}`).not.toBeNull();

        expect(seo!.sections.length).toBeGreaterThanOrEqual(3);
        for (const s of seo!.sections) {
          expect(s.heading.trim().length).toBeGreaterThan(10);
          expect(s.body.length).toBeGreaterThanOrEqual(1);
          for (const p of s.body) expect(p.trim().length).toBeGreaterThan(80);
        }

        // Менше трьох питань не дає FAQ-сніпета в пошуку.
        expect(seo!.faq.length).toBeGreaterThanOrEqual(3);
        for (const f of seo!.faq) {
          expect(f.q.trim().endsWith("?")).toBe(true);
          expect(f.a.trim().length).toBeGreaterThan(60);
        }
      });
    }
  }

  it("англійська не є копією української", () => {
    for (const slug of CATEGORIES_WITH_COPY) {
      const uk = getCategorySeo(slug, "uk")!;
      const en = getCategorySeo(slug, "en")!;
      expect(en.sections[0].heading).not.toBe(uk.sections[0].heading);
    }
  });

  it("невідома локаль відкочується на українську, а не на порожнечу", () => {
    expect(getCategorySeo("masks", "de")).toEqual(getCategorySeo("masks", "uk"));
  });

  it("категорія без запису повертає null, а не падає", () => {
    expect(getCategorySeo("does-not-exist", "uk")).toBeNull();
  });
});
