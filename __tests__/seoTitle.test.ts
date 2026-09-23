import { describe, it, expect } from "vitest";
import {
  pageTitle,
  categoryTitle,
  categoryDescription,
  productTitle,
  TITLE_MAX_LENGTH,
} from "@/lib/seo-title";
import { getBrandLine } from "@/lib/category-brand";
import uk from "@/messages/uk.json";
import en from "@/messages/en.json";

const hair = getBrandLine("shampoos");

/** Категорії з живим трафіком у Search Console — саме їх title і обрізався. */
const HAIR_CATEGORIES: Record<string, { uk: string; en: string }> = {
  shampoos: { uk: "Шампуні", en: "Shampoos" },
  conditioners: { uk: "Кондиціонери", en: "Conditioners" },
  masks: { uk: "Маски", en: "Masks" },
  "leave-in": { uk: "Незмивний догляд", en: "Leave-in care" },
  "peeling-shampoos": { uk: "Пілінг-шампуні", en: "Peeling shampoos" },
};

describe("pageTitle", () => {
  it("додає « | Viola» рівно один раз", () => {
    // Шаблон layout-у дописував суфікс до title, у якому бренд уже був:
    // "… | Viola — Na Gólov[y] | Viola". Тепер суфікс один і завжди той самий.
    expect(pageTitle("Каталог")).toBe("Каталог | Viola");
    expect(pageTitle("Каталог | Viola")).toBe("Каталог | Viola");
    expect(pageTitle("  Каталог  ")).toBe("Каталог | Viola");
  });
});

describe("title категорій", () => {
  it("шампуні: однина, як у запиті «на голову шампунь», і бренд без наголосу", () => {
    const title = categoryTitle({ slug: "shampoos", name: "Шампуні", locale: "uk", brand: hair });
    expect(title).toBe("Шампунь На Голову (Na Golovy) — купити, ціна | Viola");
  });

  for (const [slug, name] of Object.entries(HAIR_CATEGORIES)) {
    for (const locale of ["uk", "en"] as const) {
      it(`${slug} / ${locale}: вміщається в SERP і пишеться так, як шукають`, () => {
        const title = categoryTitle({ slug, name: name[locale], locale, brand: hair });
        expect(title.length).toBeLessThanOrEqual(TITLE_MAX_LENGTH);
        expect(title).toContain("Na Golovy");
        expect(title).not.toContain("Gólov");
        expect(title.match(/\| Viola/g)).toHaveLength(1);
      });
    }
  }

  it("невідомий slug бере назву категорії, а не падає", () => {
    const skin = getBrandLine("skin-care");
    const title = categoryTitle({ slug: "shower-gels", name: "Гелі для душу", locale: "uk", brand: skin });
    expect(title).toBe("Гелі для душу На Шкіру (Na WKIRy) — купити, ціна | Viola");
  });
});

describe("description категорій", () => {
  it("категорії з трафіком називають конкретні продукти й вміщаються у сніпет", () => {
    for (const [slug, name] of Object.entries(HAIR_CATEGORIES)) {
      for (const locale of ["uk", "en"] as const) {
        const d = categoryDescription({ slug, name: name[locale], locale, brand: hair });
        // Google показує ~155–160 символів; далі — обрізання посеред речення.
        expect(d.length, `${slug}/${locale}`).toBeLessThanOrEqual(165);
        expect(d).toContain("Na Golovy");
        expect(d).not.toContain("онлайн в Україні. Професійна українська");
      }
    }
  });

  it("категорія без опису отримує загальний текст зі своєю назвою", () => {
    const skin = getBrandLine("skin-care");
    const d = categoryDescription({ slug: "shower-gels", name: "Гелі для душу", locale: "uk", brand: skin });
    expect(d).toContain("гелі для душу");
    expect(d).toContain("На Шкіру");
  });
});

describe("title товару", () => {
  it("містить бренд у пошуковому написанні", () => {
    expect(productTitle("Колагеновий шампунь", "uk")).toBe(
      "Колагеновий шампунь — купити На Голову (Na Golovy) | Viola",
    );
    expect(productTitle("Collagen shampoo", "en")).toBe("Collagen shampoo — Buy Na Golovy | Viola");
  });
});

describe("статичні title у перекладах", () => {
  const keys = Object.keys(uk.meta).filter((k) => k.endsWith("Title"));

  it("кожен містить «Viola», суфікс не подвоюється, бренд без наголосу", () => {
    for (const messages of [uk, en]) {
      for (const key of keys) {
        const title = (messages.meta as Record<string, string>)[key];
        expect(title, key).toContain("Viola");
        expect(title.match(/\| Viola/g)?.length ?? 0, key).toBeLessThanOrEqual(1);
        expect(title, key).not.toContain("Gólov");
      }
    }
  });

  it("не довший за 65 символів", () => {
    // Трохи вище за TITLE_MAX_LENGTH: назва салону з містом коротшою не буває.
    for (const messages of [uk, en]) {
      for (const key of keys) {
        const title = (messages.meta as Record<string, string>)[key];
        expect(title.length, `${key}: ${title}`).toBeLessThanOrEqual(65);
      }
    }
  });
});
