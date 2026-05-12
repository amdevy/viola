export function formatPrice(price: number, locale: string = "uk"): string {
  const rounded = Math.round(price).toString();
  if (locale === "en") {
    const formatted = rounded.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${formatted} UAH`;
  }
  const formatted = rounded.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${formatted} грн`;
}

const VOLUME_UNIT_MAP: Array<[RegExp, string]> = [
  [/мл\.?(?![а-яіїєґ])/gi, "ml"],
  [/кг\.?(?![а-яіїєґ])/gi, "kg"],
  [/гр\.?(?![а-яіїєґ])/gi, "g"],
  [/шт\.?(?![а-яіїєґ])/gi, "pcs"],
  [/(?<=\d|\d\s)л\.?(?![а-яіїєґ])/gi, "l"],
  [/(?<=\d|\d\s)г\.?(?![а-яіїєґ])/gi, "g"],
];

export function formatVolume(volume: string | null | undefined, locale: string = "uk"): string {
  if (!volume) return "";
  if (locale !== "en") return volume;
  return VOLUME_UNIT_MAP.reduce((acc, [pattern, repl]) => acc.replace(pattern, repl), volume);
}

const CYRILLIC_MAP: Record<string, string> = {
  а:"a",б:"b",в:"v",г:"h",ґ:"g",д:"d",е:"e",є:"ye",ж:"zh",з:"z",
  и:"y",і:"i",ї:"yi",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",
  р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",ч:"ch",ш:"sh",
  щ:"shch",ь:"",ю:"yu",я:"ya",ё:"yo",э:"e",ъ:"",ы:"y",
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .split("")
    .map((c) => CYRILLIC_MAP[c] ?? c)
    .join("")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

export const HAIR_TYPES = [
  { value: "oily", label: "Жирне волосся" },
  { value: "dry", label: "Сухе волосся" },
  { value: "normal", label: "Нормальне волосся" },
  { value: "colored", label: "Фарбоване волосся" },
  { value: "damaged", label: "Пошкоджене волосся" },
  { value: "curly", label: "Кучеряве волосся" },
];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Очікує",
  paid: "Оплачено",
  processing: "Обробляється",
  shipped: "Відправлено",
  delivered: "Доставлено",
  cancelled: "Скасовано",
};
