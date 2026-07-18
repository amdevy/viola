import { describe, it, expect } from "vitest";
import { createCheckoutSchema, checkoutSchema, normalizeUkrainianPhone } from "@/lib/validations";

const validData = {
  firstName: "Олена",
  lastName: "Іваненко",
  phone: "050 123 45 67",
  email: "olena@example.com",
  city: "Київ",
  cityRef: "city-ref-1",
  novaPoshtaRef: "wh-ref-1",
  novaPoshtaAddress: "Відділення №1",
  paymentMethod: "callback" as const,
  notes: "",
};

describe("normalizeUkrainianPhone", () => {
  it.each([
    ["050 123 45 67", "+380501234567"],
    ["+38 (050) 123-45-67", "+380501234567"],
    ["380501234567", "+380501234567"],
    ["0501234567", "+380501234567"],
    ["501234567", "+380501234567"],
  ])("нормалізує %s → %s", (input, expected) => {
    expect(normalizeUkrainianPhone(input)).toBe(expected);
  });

  it("не чіпає закордонний номер", () => {
    expect(normalizeUkrainianPhone("+49 151 23456789")).toBe("+49 151 23456789");
  });
});

describe("checkoutSchema", () => {
  it("пропускає коректні дані і нормалізує телефон", () => {
    const result = checkoutSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.phone).toBe("+380501234567");
  });

  it("пропускає порожній email і відсутній email", () => {
    expect(checkoutSchema.safeParse({ ...validData, email: "" }).success).toBe(true);
    const { email: _email, ...withoutEmail } = validData;
    expect(checkoutSchema.safeParse(withoutEmail).success).toBe(true);
  });

  it("відхиляє невалідний email", () => {
    expect(checkoutSchema.safeParse({ ...validData, email: "not-an-email" }).success).toBe(false);
  });

  it("відхиляє закордонний телефон", () => {
    const result = checkoutSchema.safeParse({ ...validData, phone: "+49 151 23456789" });
    expect(result.success).toBe(false);
  });

  it("місто без вибору зі списку валить усі 4 поля НП", () => {
    const result = checkoutSchema.safeParse({
      ...validData,
      city: "Київ",
      cityRef: "",
      novaPoshtaRef: "",
      novaPoshtaAddress: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const failed = result.error.issues.map((i) => i.path[0]);
      expect(failed).toEqual(expect.arrayContaining(["cityRef", "novaPoshtaRef", "novaPoshtaAddress"]));
    }
  });

  it("фабрика підставляє локалізовані повідомлення", () => {
    const en = createCheckoutSchema({
      firstName: "First name required",
      lastName: "Last name required",
      phone: "Phone must be Ukrainian",
      email: "Bad email",
      city: "Pick a city",
      warehouse: "Pick a branch",
    });
    const result = en.safeParse({ ...validData, phone: "+49 151 23456789", city: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("Phone must be Ukrainian");
      expect(messages).toContain("Pick a city");
    }
  });
});
