import { describe, it, expect } from "vitest";
import { buildRitual, careStep, normalizeRitualIds, type RitualCandidate } from "@/lib/ritual";

type Row = RitualCandidate & { ritual_ids?: string[] };

// Real names from the catalogue; likes as they stood in September 2026, so the
// fallback order below is the one the shop actually gets.
const CATALOGUE: Row[] = [
  ["Гіалуроновий шампунь для волосся", 5],
  ["Колагеновий шампунь для волосся", 3],
  ["Себобалансувальний шампунь для волосся", 2],
  ["Шампунь для фарбованого волосся Harmony", 14],
  ["М'який шампунь для чоловіків DEEP BLUES", 13],
  ["Шампунь для волосся 11 амінокислот", 12],
  ["Гіалуроновий зволожувальний пілінг-шампунь", 1],
  ["Кондиціонер для волосся з гіалуроновою кислотою", 4],
  ["Колагеновий кондиціонер для волосся", 2],
  ["Кондиціонер для фарбованого волосся HARMONY", 14],
  ["Кондиціонер для волосся 11 амінокислот", 12],
  ["Гіалуронова маска для волосся 7 зволожувачів", 13],
  ["Колагенова маска для волосся", 1],
  ["Шоколадне обгортання для волосся 5 олій", 0],
  ["Гіалуроновий тонік для волосся", 11],
  ["Текстурувальний спрей для волосся з колагеном", 0],
  ["VELVET CREAM незмивний крем-кондиціонер із комплексом амінокислот", 2],
  ["Браш для укладки волосся", 0],
].map(([name, likes], i) => ({
  id: `p${i}`,
  name: name as string,
  likes_count: likes as number,
  in_stock: true,
  is_coming_soon: false,
}));

const named = (name: string, catalogue: Row[] = CATALOGUE) => catalogue.find((p) => p.name === name)!;
const ritualOf = (name: string, catalogue: Row[] = CATALOGUE, extra: Partial<Row> = {}) =>
  buildRitual({ ...named(name, catalogue), ...extra }, catalogue);
const names = (r: ReturnType<typeof ritualOf>) => r.items.map((i) => i.product.name);

describe("careStep — крок ритуалу за назвою", () => {
  it.each([
    ["Гіалуроновий зволожувальний пілінг-шампунь", "cleanse"],
    ["Мультивітамінний тонізувальний шампунь для волосся", "cleanse"],
    ["Крем-шампунь для чутливої шкіри голови", "cleanse"],
    ["Кондиціонер для фарбованого волосся HARMONY", "condition"],
    ["Мультивітамінна тонізувальна маска для волосся", "mask"],
    ["Шоколадне обгортання для волосся 5 олій", "mask"],
    ["VELVET CREAM незмивний крем-кондиціонер із трегалозою", "leave_in"],
    ["ROYAL SHINE Спрей-термозахист із гідролізованим шовком", "leave_in"],
    ["DIAMOND ELIXIR флюїд для волосся з олією жожоба", "leave_in"],
    ["BB-Крем для волосся шовк + 18-MEA", "leave_in"],
    ["Гіалуроновий тонік для волосся", "leave_in"],
    ["Браш для укладки волосся", null],
  ])("%s → %s", (name, step) => {
    expect(careStep(name)).toBe(step);
  });
});

describe("buildRitual", () => {
  it("шампунь лінії: кондиціонер, маска й незмивний засіб тієї ж лінії, а не інші шампуні", () => {
    const r = ritualOf("Гіалуроновий шампунь для волосся");
    expect(r.kind).toBe("line");
    expect(names(r)).toEqual([
      "Гіалуроновий шампунь для волосся",
      "Кондиціонер для волосся з гіалуроновою кислотою",
      "Гіалуронова маска для волосся 7 зволожувачів",
      "Гіалуроновий тонік для волосся",
    ]);
    expect(r.items.map((i) => i.step)).toEqual(["cleanse", "condition", "mask", "leave_in"]);
  });

  it("товар посеред ритуалу стоїть на своєму кроці", () => {
    const r = ritualOf("Колагенова маска для волосся");
    expect(r.kind).toBe("line");
    expect(names(r)).toEqual([
      "Колагеновий шампунь для волосся",
      "Колагеновий кондиціонер для волосся",
      "Колагенова маска для волосся",
      "Текстурувальний спрей для волосся з колагеном",
    ]);
    expect(r.items.map((i) => i.isMain)).toEqual([false, false, true, false]);
  });

  it("без лінії: найпопулярніше на кожен крок, але не засоби для чужої потреби", () => {
    // HARMONY (для фарбованого) і DEEP BLUES (для чоловіків) мають найбільше
    // лайків, та пропонувати їх кожному було б навмання.
    const r = ritualOf("Шоколадне обгортання для волосся 5 олій");
    expect(r.kind).toBe("complement");
    expect(names(r)).toEqual([
      "Шампунь для волосся 11 амінокислот",
      "Кондиціонер для волосся 11 амінокислот",
      "Шоколадне обгортання для волосся 5 олій",
      "Гіалуроновий тонік для волосся",
    ]);
  });

  it("засіб для фарбованого волосся йде в пару до свого, решта кроків — загальні", () => {
    const r = ritualOf("Шампунь для фарбованого волосся Harmony");
    expect(r.kind).toBe("complement");
    expect(names(r)).toEqual([
      "Шампунь для фарбованого волосся Harmony",
      "Кондиціонер для фарбованого волосся HARMONY",
      "Гіалуронова маска для волосся 7 зволожувачів",
      "Гіалуроновий тонік для волосся",
    ]);
  });

  it("товарів, яких немає в наявності або які «очікуються», не пропонує", () => {
    const catalogue = CATALOGUE.map((p) =>
      p.name === "Кондиціонер для волосся з гіалуроновою кислотою"
        ? { ...p, in_stock: false }
        : p.name === "Гіалуронова маска для волосся 7 зволожувачів"
          ? { ...p, is_coming_soon: true }
          : p,
    );
    const r = ritualOf("Гіалуроновий шампунь для волосся", catalogue);
    expect(names(r)).toEqual([
      "Гіалуроновий шампунь для волосся",
      "Кондиціонер для волосся 11 амінокислот",
      "Колагенова маска для волосся",
      "Гіалуроновий тонік для волосся",
    ]);
    expect(r.kind).toBe("complement");
  });

  it("добірка з адмінки замінює автоматичну: без самого товару, недоступних і повторів, у порядку ритуалу", () => {
    const self = named("Гіалуроновий шампунь для волосся");
    const catalogue = CATALOGUE.map((p) =>
      p.name === "Колагеновий кондиціонер для волосся" ? { ...p, in_stock: false } : p,
    );
    const pick = (name: string) => named(name, catalogue).id;
    const r = ritualOf("Гіалуроновий шампунь для волосся", catalogue, {
      ritual_ids: [
        pick("VELVET CREAM незмивний крем-кондиціонер із комплексом амінокислот"),
        pick("Колагеновий кондиціонер для волосся"),
        self.id,
        "deleted-product",
        pick("Колагенова маска для волосся"),
        pick("Колагенова маска для волосся"),
      ],
    });
    expect(r.kind).toBe("curated");
    expect(names(r)).toEqual([
      "Гіалуроновий шампунь для волосся",
      "Колагенова маска для волосся",
      "VELVET CREAM незмивний крем-кондиціонер із комплексом амінокислот",
    ]);
  });

  it("якщо жоден вибраний засіб недоступний — знову автоматичний ритуал", () => {
    const r = ritualOf("Гіалуроновий шампунь для волосся", CATALOGUE, { ritual_ids: ["deleted-product"] });
    expect(r.kind).toBe("line");
    expect(r.items).toHaveLength(4);
  });

  it("не догляд за волоссям і без добірки — блоку немає", () => {
    expect(ritualOf("Браш для укладки волосся").items).toEqual([]);
  });
});

describe("normalizeRitualIds", () => {
  it("прибирає порожні слоти, повтори й сам товар, не більше трьох", () => {
    expect(normalizeRitualIds(["a", "", "a", "self", "b", "c", "d"], "self")).toEqual(["a", "b", "c"]);
  });
});
