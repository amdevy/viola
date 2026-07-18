import { z } from "zod";

// Приводить будь-який звичний запис українського номера
// (050 123 45 67, +38 (050) 123-45-67, 380501234567) до +380XXXXXXXXX
export function normalizeUkrainianPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) return `+380${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith("380")) return `+${digits}`;
  if (digits.length === 9) return `+380${digits}`;
  return value.trim();
}

export type CheckoutErrorMessages = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  city: string;
  warehouse: string;
};

const defaultCheckoutErrors: CheckoutErrorMessages = {
  firstName: "Введіть ім'я (мін. 2 символи)",
  lastName: "Введіть прізвище (мін. 2 символи)",
  phone: "Введіть номер, напр. 050 123 45 67",
  email: "Невірний email",
  city: "Оберіть місто зі списку",
  warehouse: "Оберіть відділення зі списку",
};

// Українські номери → +380XXXXXXXXX, закордонні → лише цифри з опційним +
export function normalizePhone(value: string): string {
  const ua = normalizeUkrainianPhone(value);
  if (/^\+380\d{9}$/.test(ua)) return ua;
  const digits = value.replace(/\D/g, "");
  return value.trim().startsWith("+") ? `+${digits}` : digits;
}

export function isValidPhone(value: string): boolean {
  return /^\+?\d{8,15}$/.test(normalizePhone(value));
}

// Фабрика, щоб тексти помилок можна було локалізувати (en-чекаут показував українські)
export function createCheckoutSchema(m: CheckoutErrorMessages = defaultCheckoutErrors) {
  return z.object({
    firstName: z.string().min(2, m.firstName),
    lastName: z.string().min(2, m.lastName),
    phone: z
      .string()
      .transform(normalizePhone)
      .pipe(z.string().regex(/^\+?\d{8,15}$/, m.phone)),
    email: z.string().email(m.email).optional().or(z.literal("")),
    city: z.string().min(1, m.city),
    cityRef: z.string().min(1, m.city),
    novaPoshtaRef: z.string().min(1, m.warehouse),
    novaPoshtaAddress: z.string().min(1, m.warehouse),
    paymentMethod: z.enum(["card", "callback"]),
    notes: z.string().optional(),
  });
}

export const checkoutSchema = createCheckoutSchema();

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

export const productSchema = z.object({
  name: z.string().min(1, "Назва обов'язкова"),
  slug: z.string().min(1, "Slug обов'язковий"),
  description: z.string().optional(),
  ingredients: z.string().optional(),
  how_to_use: z.string().optional(),
  price: z.number().min(0.01, "Ціна повинна бути більше 0"),
  compare_price: z.number().optional().nullable(),
  category_id: z.string().optional().nullable(),
  in_stock: z.boolean().default(true),
  volume: z.string().optional(),
  hair_type: z.array(z.string()).default([]),
});

export type ProductFormData = z.infer<typeof productSchema>;

export const loginSchema = z.object({
  email: z.string().email("Невірний email"),
  password: z.string().min(6, "Мін. 6 символів"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
