import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { parseProductText, looksLikeInci } from "@/lib/product-text";
import ProductText from "@/components/shop/ProductText";

const INCI =
  "Aqua (Water), Cetearyl Alcohol, Behentrimonium Chloride, Coco-Caprylate, Glycerin, Parfum (Fragrance), Cetrimonium Chloride, Trehalose.";

// The shape of the new «Склад» texts.
const INGREDIENTS = `Ключові компоненти:
• Гіалуронат натрію (Sodium Hyaluronate) — утримує вологу й додає блиску
• Абрикосові кісточки (Prunus Armeniaca (Apricot) Seed Powder, Perlite) — м’яко відлущують
• Urea — притягує вологу
• Протеїн гороху (Cetearamidoethyldiethonium Succinoyl Hydrolyzed Pea Protein) — імітує F-шар

Повний склад (INCI):
${INCI}`;

// The shape of the new «Як використовувати» texts.
const HOW_TO_USE = `Крок 1. Вимийте волосся шампунем.
Крок 2. Розподіліть маску по довжині.
Крок 3. Змийте теплою водою не вище 40 °C.

Важливо:
• Не перевищуйте час витримки.
• Тепло для цієї маски — обов’язкова частина процедури.

Поєднання: чергуйте з Колагеновою маскою.`;

// A how-to-use already in the database (the 250 ml «Емоції» line).
const LEGACY = `Спосіб використання:
нанести на вологе волосся та шкіру голови, спінити, ретельно змити.

Застереження:
використовувати тільки за призначенням.`;

describe("parseProductText", () => {
  it("розбирає «Склад»: підзаголовки, список з термінами й INCI", () => {
    expect(parseProductText(INGREDIENTS)).toEqual([
      { type: "heading", text: "Ключові компоненти" },
      {
        type: "list",
        items: [
          { term: "Гіалуронат натрію", inci: "Sodium Hyaluronate", text: "утримує вологу й додає блиску" },
          {
            term: "Абрикосові кісточки",
            inci: "Prunus Armeniaca (Apricot) Seed Powder, Perlite",
            text: "м’яко відлущують",
          },
          { term: "Urea", text: "притягує вологу" },
          {
            term: "Протеїн гороху",
            inci: "Cetearamidoethyldiethonium Succinoyl Hydrolyzed Pea Protein",
            text: "імітує F-шар",
          },
        ],
      },
      { type: "heading", text: "Повний склад (INCI)" },
      { type: "inci", text: INCI },
    ]);
  });

  it("розбирає «Як використовувати»: кроки, «Важливо» і «Поєднання»", () => {
    expect(parseProductText(HOW_TO_USE)).toEqual([
      {
        type: "steps",
        items: [
          { n: 1, text: "Вимийте волосся шампунем." },
          { n: 2, text: "Розподіліть маску по довжині." },
          { n: 3, text: "Змийте теплою водою не вище 40 °C." },
        ],
      },
      { type: "heading", text: "Важливо" },
      {
        type: "list",
        items: [
          { text: "Не перевищуйте час витримки." },
          // A dash outside «Ключові компоненти» is part of the sentence.
          { text: "Тепло для цієї маски — обов’язкова частина процедури." },
        ],
      },
      { type: "labeled", label: "Поєднання", text: "чергуйте з Колагеновою маскою." },
    ]);
  });

  it("старі тексти: підзаголовок окремо, речення з великої літери", () => {
    expect(parseProductText(LEGACY)).toEqual([
      { type: "heading", text: "Спосіб використання" },
      { type: "paragraph", text: "Нанести на вологе волосся та шкіру голови, спінити, ретельно змити." },
      { type: "heading", text: "Застереження" },
      { type: "paragraph", text: "Використовувати тільки за призначенням." },
    ]);
  });

  it("голий список INCI без підзаголовка теж розпізнається", () => {
    expect(parseProductText(INCI)).toEqual([{ type: "inci", text: INCI }]);
  });

  it("опис лишається абзацами; «АКТИВИ: 10» — підписаний рядок", () => {
    const description =
      "Маска розроблена для живлення сухого волосся.\nТрегалоза — забезпечує зволоження та комфорт.\nАКТИВИ: 10";
    expect(parseProductText(description)).toEqual([
      { type: "paragraph", text: "Маска розроблена для живлення сухого волосся." },
      { type: "paragraph", text: "Трегалоза — забезпечує зволоження та комфорт." },
      { type: "labeled", label: "АКТИВИ", text: "10" },
    ]);
  });

  it("речення з двокрапкою всередині не стає підписом", () => {
    const line = "Нанесіть засіб на вологе волосся: спершу на кінчики, далі по довжині.";
    expect(parseProductText(line)).toEqual([{ type: "paragraph", text: line }]);
  });

  it("порожній текст — нічого", () => {
    expect(parseProductText(null)).toEqual([]);
    expect(parseProductText("  \n \n")).toEqual([]);
  });

  it("кирилиця з комами — не INCI", () => {
    expect(looksLikeInci("вода, гліцерин, пантенол, трегалоза, сечовина, алантоїн, інулін, бетаїн")).toBe(false);
  });
});

describe("ProductText", () => {
  it("рендерить кроки нумерованим списком, а весь текст — у документі", () => {
    render(<ProductText text={HOW_TO_USE} />);
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("1. Вимийте волосся шампунем.");
    expect(screen.getByRole("heading", { name: "Важливо" })).toBeInTheDocument();
    expect(screen.getByText("Поєднання:")).toBeInTheDocument();
  });

  it("термін у списку жирним, назва INCI поруч", () => {
    render(<ProductText text={INGREDIENTS} />);
    expect(screen.getByText("Гіалуронат натрію")).toHaveClass("font-semibold");
    expect(screen.getByText(INCI)).toBeInTheDocument();
  });
});
