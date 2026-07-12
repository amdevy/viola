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

export const checkoutSchema = z.object({
  firstName: z.string().min(2, "Введіть ім'я (мін. 2 символи)"),
  lastName: z.string().min(2, "Введіть прізвище (мін. 2 символи)"),
  phone: z
    .string()
    .transform(normalizeUkrainianPhone)
    .pipe(z.string().regex(/^\+380\d{9}$/, "Введіть номер, напр. 050 123 45 67")),
  email: z.string().email("Невірний email").optional().or(z.literal("")),
  city: z.string().min(1, "Оберіть місто"),
  cityRef: z.string().min(1, "Оберіть місто"),
  novaPoshtaRef: z.string().min(1, "Оберіть відділення"),
  novaPoshtaAddress: z.string().min(1, "Оберіть відділення"),
  paymentMethod: z.enum(["card", "callback"]),
  notes: z.string().optional(),
});

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
