import { z } from "zod";

export const checkoutSchema = z.object({
  firstName: z.string().min(2, "Введіть ім'я (мін. 2 символи)"),
  lastName: z.string().min(2, "Введіть прізвище (мін. 2 символи)"),
  phone: z
    .string()
    .regex(/^\+380\d{9}$/, "Формат: +380XXXXXXXXX"),
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
