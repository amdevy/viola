import { describe, it, expect } from "vitest";
import {
  buildSearchIndex,
  matchesSearch,
  normalizeSearchText,
  searchProducts,
  type SearchProduct,
} from "@/lib/search";

const product = (over: Partial<SearchProduct> & Pick<SearchProduct, "id" | "name">): SearchProduct => ({
  slug: over.id,
  name_en: null,
  price: 1000,
  image: null,
  volume: "250 мл",
  category: null,
  category_en: null,
  in_stock: true,
  is_coming_soon: false,
  is_bestseller: false,
  ...over,
});

const CATALOGUE = buildSearchIndex([
  product({
    id: "harmony-shampoo",
    name: "Шампунь для фарбованого волосся Harmony",
    name_en: "Harmony shampoo for coloured hair",
    category: "Шампуні",
    category_en: "Shampoos",
  }),
  product({
    id: "harmony-conditioner",
    name: "Кондиціонер для фарбованого волосся HARMONY",
    name_en: "Harmony conditioner for coloured hair",
    category: "Кондиціонери",
    category_en: "Conditioners",
  }),
  product({
    id: "sebo",
    name: "Себобалансувальний шампунь для волосся",
    category: "Шампуні",
    category_en: "Shampoos",
    is_bestseller: true,
  }),
  product({
    id: "mask",
    name: "Маска для волосся 5 ліпідів",
    name_en: "5 lipids hair mask",
    category: "Маски",
    category_en: "Masks",
    in_stock: false,
  }),
  product({
    id: "spray",
    name: "ROYAL SHINE спрей-термозахист із церамідами",
    category: "Незмивний догляд",
    category_en: "Leave-in care",
  }),
]);

const ids = (query: string) => searchProducts(CATALOGUE, query).map((p) => p.id);

describe("пошук товарів", () => {
  it("зводить текст до спільного вигляду: регістр, наголоси, апострофи, и/і", () => {
    expect(normalizeSearchText("Na Gólov[y]")).toBe("na golov y");
    expect(normalizeSearchText("  Зв'язок — ДОГЛЯД!  ")).toBe(normalizeSearchText("звязок догляд"));
    expect(normalizeSearchText("кондиціонер")).toBe(normalizeSearchText("кондиционер"));
  });

  it("знаходить за початком слова — так набирають на телефоні", () => {
    expect(ids("шамп")).toEqual(["sebo", "harmony-shampoo"]);
  });

  it("вимагає всіх слів запиту, в будь-якому порядку", () => {
    expect(ids("harmony шампунь")).toEqual(["harmony-shampoo"]);
    expect(ids("фарбованого кондиціонер")).toEqual(["harmony-conditioner"]);
  });

  it("розуміє російське написання й англійську назву", () => {
    // Половина відвідувачів набирає «кондиционер» замість «кондиціонер», а на
    // /en товар шукають за англійською назвою.
    expect(ids("кондиционер")).toEqual(["harmony-conditioner"]);
    expect(ids("lipids")).toEqual(["mask"]);
    expect(ids("термозахист")).toEqual(["spray"]);
  });

  it("шукає і за категорією", () => {
    expect(ids("маски")).toEqual(["mask"]);
    expect(ids("shampoos")).toEqual(["sebo", "harmony-shampoo"]);
  });

  it("ставить хіти й те, що можна купити, вище за решту рівних збігів", () => {
    // «для волосся» є в усіх трьох; хіт — перший, товар без наявності — останній.
    expect(ids("для волосся")).toEqual(["sebo", "harmony-shampoo", "harmony-conditioner", "mask"]);
  });

  it("не шукає за однією літерою і нічого не вигадує", () => {
    expect(ids("ш")).toEqual([]);
    expect(ids("   ")).toEqual([]);
    expect(ids("парфуми")).toEqual([]);
  });

  it("matchesSearch — той самий збіг для каталогу /shop?search=", () => {
    expect(matchesSearch(["Маска для волосся 5 ліпідів", "5 lipids hair mask"], "маска ліпід")).toBe(true);
    expect(matchesSearch(["Маска для волосся 5 ліпідів"], "шампунь")).toBe(false);
    // Порожній запит нічого не відсіює.
    expect(matchesSearch(["Маска"], "  ")).toBe(true);
  });
});
