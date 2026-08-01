import { describe, it, expect } from "vitest";
import {
  createCheckoutSchema,
  checkoutSchema,
  normalizeUkrainianPhone,
  normalizePhone,
  isValidPhone,
  orderRequestSchema,
} from "@/lib/validations";
import { safeJsonLd } from "@/lib/utils";

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
  acceptOffer: true as const,
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

describe("normalizePhone / isValidPhone", () => {
  it("український номер лишається у форматі +380", () => {
    expect(normalizePhone("050 123 45 67")).toBe("+380501234567");
  });

  it("закордонний номер стискається до +цифри", () => {
    expect(normalizePhone("+49 (151) 234-567-89")).toBe("+4915123456789");
  });

  it("приймає валідні номери і відкидає сміття", () => {
    expect(isValidPhone("050 123 45 67")).toBe(true);
    expect(isValidPhone("+49 151 23456789")).toBe(true);
    expect(isValidPhone("123")).toBe(false);
    expect(isValidPhone("не номер")).toBe(false);
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
    const withoutEmail = Object.fromEntries(Object.entries(validData).filter(([k]) => k !== "email"));
    expect(checkoutSchema.safeParse(withoutEmail).success).toBe(true);
  });

  it("відхиляє невалідний email", () => {
    expect(checkoutSchema.safeParse({ ...validData, email: "not-an-email" }).success).toBe(false);
  });

  it("приймає закордонний телефон і нормалізує його", () => {
    const result = checkoutSchema.safeParse({ ...validData, phone: "+49 151 23456789" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.phone).toBe("+4915123456789");
  });

  it("відхиляє надто короткий телефон", () => {
    expect(checkoutSchema.safeParse({ ...validData, phone: "123" }).success).toBe(false);
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
      phone: "Phone is invalid",
      email: "Bad email",
      city: "Pick a city",
      warehouse: "Pick a branch",
      offer: "Accept the offer",
    });
    const result = en.safeParse({ ...validData, phone: "123", city: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("Phone is invalid");
      expect(messages).toContain("Pick a city");
    }
  });

  it("вимагає згоди з офертою", () => {
    expect(checkoutSchema.safeParse({ ...validData, acceptOffer: false }).success).toBe(false);
    const without = Object.fromEntries(
      Object.entries(validData).filter(([k]) => k !== "acceptOffer")
    );
    expect(checkoutSchema.safeParse(without).success).toBe(false);
  });
});

describe("orderRequestSchema (серверний контракт)", () => {
  const validOrder = {
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
    acceptOffer: true as const,
    items: [{ productId: "11111111-1111-1111-1111-111111111111", quantity: 2 }],
  };

  it("приймає коректне замовлення", () => {
    expect(orderRequestSchema.safeParse(validOrder).success).toBe(true);
  });

  it("відкидає ціну й суму з клієнта — вони не входять у контракт", () => {
    const result = orderRequestSchema.safeParse({
      ...validOrder,
      total: 1,
      items: [{ productId: "11111111-1111-1111-1111-111111111111", quantity: 1, price: 1 }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect("total" in result.data).toBe(false);
      expect(result.data.items[0]).toEqual({
        productId: "11111111-1111-1111-1111-111111111111",
        quantity: 1,
      });
    }
  });

  it("відхиляє порожній кошик", () => {
    expect(orderRequestSchema.safeParse({ ...validOrder, items: [] }).success).toBe(false);
  });

  it("відхиляє нульову, від'ємну та дробову кількість", () => {
    for (const quantity of [0, -3, 1.5]) {
      const items = [{ productId: "11111111-1111-1111-1111-111111111111", quantity }];
      expect(orderRequestSchema.safeParse({ ...validOrder, items }).success).toBe(false);
    }
  });

  it("відхиляє productId, що не є UUID", () => {
    const items = [{ productId: "'; drop table orders; --", quantity: 1 }];
    expect(orderRequestSchema.safeParse({ ...validOrder, items }).success).toBe(false);
  });

  it("відхиляє замовлення без згоди з офертою і з невідомим методом оплати", () => {
    expect(orderRequestSchema.safeParse({ ...validOrder, acceptOffer: false }).success).toBe(false);
    expect(orderRequestSchema.safeParse({ ...validOrder, paymentMethod: "cash" }).success).toBe(false);
  });

  it("обмежує довжину нотатки та кількість позицій", () => {
    expect(
      orderRequestSchema.safeParse({ ...validOrder, notes: "a".repeat(2001) }).success
    ).toBe(false);
    const many = Array.from({ length: 51 }, () => ({
      productId: "11111111-1111-1111-1111-111111111111",
      quantity: 1,
    }));
    expect(orderRequestSchema.safeParse({ ...validOrder, items: many }).success).toBe(false);
  });
});

describe("safeJsonLd", () => {
  it("екранує </script> — відгук більше не може вийти з JSON-LD блоку", () => {
    const payload = { reviewBody: "</script><script>alert(1)</script>" };
    const out = safeJsonLd(payload);
    expect(out).not.toContain("</script>");
    expect(out).not.toContain("<script>");
    expect(out).toContain("\\u003c");
  });

  it("не змінює даних — результат парситься назад у той самий обʼєкт", () => {
    const payload = { name: "Шампунь <Harmony>", rating: 5 };
    expect(JSON.parse(safeJsonLd(payload))).toEqual(payload);
  });
});
