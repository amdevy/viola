import { describe, it, expect } from "vitest";
import {
  getCategoryFacts,
  productCountText,
  priceRangeText,
  priceFromText,
  categoryLinkLabel,
  categoryFactsLine,
  categoryPriceFaq,
} from "@/lib/category-facts";
import { getBrandLine } from "@/lib/category-brand";

const HAIR = getBrandLine("shampoos");
const SKIN = getBrandLine("skin-care");

const product = (price: number | string, in_stock = true) => ({ price, in_stock });

describe("getCategoryFacts", () => {
  it("рахує товари, наявність і діапазон цін", () => {
    expect(getCategoryFacts([product(900), product(2650), product(1500)])).toEqual({
      count: 3,
      inStock: 3,
      minPrice: 900,
      maxPrice: 2650,
    });
  });

  it("ціну бере лише з того, що є в наявності", () => {
    // Найдешевший незмивний засіб був не в наявності: «від 1 200» обіцяло б
    // ціну, за якою нічого не купиш.
    const facts = getCategoryFacts([product(1200, false), product(1750), product(2050)]);
    expect(facts).toMatchObject({ count: 3, inStock: 2, minPrice: 1750, maxPrice: 2050 });
  });

  it("якщо в наявності нічого немає — показує ціни всіх", () => {
    expect(getCategoryFacts([product(1200, false), product(1500, false)])).toMatchObject({
      inStock: 0,
      minPrice: 1200,
      maxPrice: 1500,
    });
  });

  it("розуміє ціну рядком, як її віддає numeric-колонка", () => {
    expect(getCategoryFacts([product("900.00"), product("2650.00")])).toMatchObject({
      minPrice: 900,
      maxPrice: 2650,
    });
  });

  it("без товарів або без жодної ціни повертає null", () => {
    expect(getCategoryFacts([])).toBeNull();
    expect(getCategoryFacts([product(0), product("abc")])).toBeNull();
  });
});

describe("productCountText", () => {
  it("відмінює «товар» за числом", () => {
    expect(productCountText(1, "uk")).toBe("1 товар");
    expect(productCountText(3, "uk")).toBe("3 товари");
    expect(productCountText(5, "uk")).toBe("5 товарів");
    expect(productCountText(11, "uk")).toBe("11 товарів");
    expect(productCountText(13, "uk")).toBe("13 товарів");
    expect(productCountText(19, "uk")).toBe("19 товарів");
    expect(productCountText(21, "uk")).toBe("21 товар");
    expect(productCountText(22, "uk")).toBe("22 товари");
  });

  it("англійською — однина й множина", () => {
    expect(productCountText(1, "en")).toBe("1 product");
    expect(productCountText(19, "en")).toBe("19 products");
  });
});

describe("ціна текстом", () => {
  const range = { count: 19, inStock: 19, minPrice: 900, maxPrice: 2650 };
  const flat = { count: 5, inStock: 5, minPrice: 1500, maxPrice: 1500 };

  it("діапазон: валюта один раз, наприкінці", () => {
    expect(priceRangeText(range, "uk")).toBe("від 900 до 2 650 грн");
    expect(priceRangeText(range, "en")).toBe("from 900 to 2,650 UAH");
  });

  it("однакова ціна — без «від … до»", () => {
    expect(priceRangeText(flat, "uk")).toBe("1 500 грн");
    expect(priceFromText(flat, "uk")).toBe("1 500 грн");
  });

  it("коротка форма для посилання", () => {
    expect(priceFromText(range, "uk")).toBe("від 900 грн");
    expect(priceFromText(range, "en")).toBe("from 900 UAH");
  });
});

describe("categoryLinkLabel", () => {
  it("анкор містить і категорію, і бренд — так, як шукають", () => {
    expect(categoryLinkLabel("Шампуні", HAIR, "uk")).toBe("Шампуні На Голову");
    expect(categoryLinkLabel("Shampoos", HAIR, "en")).toBe("Na Golovy Shampoos");
  });

  it("лінійка для шкіри не отримує бренд для волосся", () => {
    expect(categoryLinkLabel("Гелі для душу", SKIN, "uk")).toBe("Гелі для душу На Шкіру");
  });

  it("ніколи не пише «На Голови»", () => {
    expect(categoryLinkLabel("Маски", HAIR, "uk")).not.toMatch(/На Голови/);
  });
});

describe("categoryFactsLine", () => {
  it("шампуні: кількість, діапазон, усе в наявності", () => {
    expect(
      categoryFactsLine({
        name: "Шампуні",
        locale: "uk",
        brand: HAIR,
        facts: { count: 19, inStock: 19, minPrice: 900, maxPrice: 2650 },
      }),
    ).toBe("Шампуні На Голову (Na Golovy) у Viola: 19 товарів, ціна від 900 до 2 650 грн, усі в наявності.");
  });

  it("частина не в наявності — каже скільки є", () => {
    expect(
      categoryFactsLine({
        name: "Незмивний догляд",
        locale: "uk",
        brand: HAIR,
        facts: { count: 18, inStock: 14, minPrice: 1750, maxPrice: 2050 },
      }),
    ).toBe("Незмивний догляд На Голову (Na Golovy) у Viola: 18 товарів, ціна від 1 750 до 2 050 грн, 14 в наявності.");
  });

  it("нічого немає в наявності — про наявність мовчить", () => {
    const line = categoryFactsLine({
      name: "Маски",
      locale: "uk",
      brand: HAIR,
      facts: { count: 2, inStock: 0, minPrice: 2100, maxPrice: 2800 },
    });
    expect(line).toBe("Маски На Голову (Na Golovy) у Viola: 2 товари, ціна від 2 100 до 2 800 грн.");
  });

  it("англійською", () => {
    expect(
      categoryFactsLine({
        name: "Shampoos",
        locale: "en",
        brand: HAIR,
        facts: { count: 19, inStock: 19, minPrice: 900, maxPrice: 2650 },
      }),
    ).toBe("Na Golovy Shampoos at Viola: 19 products, priced from 900 to 2,650 UAH, all in stock.");
  });
});

describe("categoryPriceFaq", () => {
  const facts = { count: 19, inStock: 19, minPrice: 900, maxPrice: 2650 };

  it("питання в однині — так, як пишуть у пошуку", () => {
    const faq = categoryPriceFaq({ slug: "shampoos", name: "Шампуні", locale: "uk", brand: HAIR, facts });
    expect(faq.q).toBe("Скільки коштує шампунь На Голову?");
    expect(faq.a).toContain("від 900 до 2 650 грн");
    expect(faq.a).toContain("На Голову (Na Golovy)");
  });

  it("категорія без відомої однини отримує нейтральне питання", () => {
    const faq = categoryPriceFaq({ slug: "shower-gels", name: "Гелі для душу", locale: "uk", brand: SKIN, facts });
    expect(faq.q).toBe("Які ціни на гелі для душу На Шкіру?");
  });

  it("однакова ціна — відповідь без діапазону", () => {
    const faq = categoryPriceFaq({
      slug: "peeling-shampoos",
      name: "Пілінг-шампуні",
      locale: "uk",
      brand: HAIR,
      facts: { count: 5, inStock: 5, minPrice: 1500, maxPrice: 1500 },
    });
    expect(faq.a).toContain("коштують 1 500 грн");
    expect(faq.a).not.toContain("від");
  });

  it("має форму FAQ на обох мовах: питання зі знаком, змістовна відповідь", () => {
    for (const locale of ["uk", "en"]) {
      const faq = categoryPriceFaq({ slug: "masks", name: locale === "en" ? "Masks" : "Маски", locale, brand: HAIR, facts });
      expect(faq.q.trim().endsWith("?")).toBe(true);
      expect(faq.a.length).toBeGreaterThan(60);
    }
  });
});
