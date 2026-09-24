import { describe, it, expect } from "vitest";
import {
  pageTitle,
  categoryTitle,
  categoryDescription,
  productTitle,
  TITLE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
} from "@/lib/seo-title";
import { getBrandLine } from "@/lib/category-brand";
import uk from "@/messages/uk.json";
import en from "@/messages/en.json";

const hair = getBrandLine("shampoos");

/** The brand's stylised spelling ("Na Gólov[y]", "Na Golov[y]") — never in a title. */
const STYLISED_BRAND = /Gólov|\[y\]/;

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

  it("пише бренд так, як його шукають, навіть у title з бази", () => {
    // Назви статей блогу приходять з бази зі стилізованим "Na Gólov[y]".
    expect(pageTitle("Де купити Na Gólov[y] в Україні — офіційний продаж")).toBe(
      "Де купити Na Golovy в Україні — офіційний продаж | Viola",
    );
    expect(pageTitle("Na Golov[y] і   догляд")).toBe("Na Golovy і догляд | Viola");
    expect(pageTitle("Na WKIR[y]")).toBe("Na WKIR[y] | Viola");
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
        expect(title).not.toMatch(STYLISED_BRAND);
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
    const generic = { uk: "онлайн в Україні. Професійна українська", en: "online. Professional Ukrainian" };
    for (const [slug, name] of Object.entries(HAIR_CATEGORIES)) {
      for (const locale of ["uk", "en"] as const) {
        const d = categoryDescription({ slug, name: name[locale], locale, brand: hair });
        expect(d.length, `${slug}/${locale}`).toBeLessThanOrEqual(DESCRIPTION_MAX_LENGTH);
        expect(d).toContain("Na Golovy");
        expect(d, `${slug}/${locale} впав у загальний текст`).not.toContain(generic[locale]);
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
  it("коротка назва отримує повний суфікс", () => {
    expect(productTitle("Колагеновий шампунь", "uk")).toBe(
      "Колагеновий шампунь — купити На Голову (Na Golovy) | Viola",
    );
    expect(productTitle("Collagen shampoo", "en")).toBe("Collagen shampoo — Buy Na Golovy | Viola");
  });

  it("довга назва скорочує суфікс, а не обрізається посеред бренду", () => {
    // Медіана назв — 41 символ: з повним суфіксом 60 з 62 title не вміщались.
    expect(productTitle("Шампунь для фарбованого волосся Harmony", "uk")).toBe(
      "Шампунь для фарбованого волосся Harmony — Na Golovy",
    );
    expect(productTitle("Гіалуроновий тонік для волосся", "uk")).toBe(
      "Гіалуроновий тонік для волосся — На Голову (Na Golovy) | Viola",
    );
  });

  it("назву не ріже, навіть коли вона сама довша за ліміт", () => {
    const name = "Амінокислотна маска-компрес для інтенсивного відновлення та наповнення волосся";
    expect(productTitle(name, "uk")).toBe(`${name} — Na Golovy`);
  });

  it("прибирає подвійні пробіли з назв у базі", () => {
    expect(productTitle("Пілінг-шампунь для шкіри   голови ", "uk")).toBe(
      "Пілінг-шампунь для шкіри голови — На Голову (Na Golovy)",
    );
  });

  it("щойно суфікс вміщається, title не довший за ліміт", () => {
    for (let n = 1; n <= TITLE_MAX_LENGTH - " — Na Golovy".length; n++) {
      for (const locale of ["uk", "en"]) {
        const title = productTitle("я".repeat(n), locale);
        expect(title.length, `${locale}, назва ${n}`).toBeLessThanOrEqual(TITLE_MAX_LENGTH);
        expect(title).toContain("Na Golovy");
      }
    }
  });
});

describe("статичні title і description у перекладах", () => {
  const titleKeys = Object.keys(uk.meta).filter((k) => k.endsWith("Title"));
  const descriptionKeys = Object.keys(uk.meta).filter((k) => k.endsWith("Description"));

  it("кожен title містить «Viola», суфікс не подвоюється, бренд без стилізації", () => {
    for (const messages of [uk, en]) {
      for (const key of titleKeys) {
        const title = (messages.meta as Record<string, string>)[key];
        expect(title, key).toContain("Viola");
        expect(title.match(/\| Viola/g)?.length ?? 0, key).toBeLessThanOrEqual(1);
        expect(title, key).not.toMatch(STYLISED_BRAND);
      }
    }
  });

  it("title вміщаються в SERP", () => {
    for (const messages of [uk, en]) {
      for (const key of titleKeys) {
        const title = (messages.meta as Record<string, string>)[key];
        expect(title.length, `${key}: ${title}`).toBeLessThanOrEqual(TITLE_MAX_LENGTH);
      }
    }
  });

  it("description вміщаються у сніпет і не пишуть бренд зі стилізацією", () => {
    for (const messages of [uk, en]) {
      for (const key of descriptionKeys) {
        const d = (messages.meta as Record<string, string>)[key];
        expect(d.length, `${key}: ${d}`).toBeLessThanOrEqual(DESCRIPTION_MAX_LENGTH);
        expect(d, key).not.toMatch(STYLISED_BRAND);
      }
    }
  });
});
