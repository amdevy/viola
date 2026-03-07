export function formatPrice(price: number): string {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04FF\s-]/g, "")
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
