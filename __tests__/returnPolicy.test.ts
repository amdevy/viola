import { describe, it, expect } from "vitest";
import uk from "@/messages/uk.json";
import en from "@/messages/en.json";

/**
 * Публічна оферта (§5) і умови (§4): косметика належної якості поверненню не
 * підлягає (Постанова КМУ №172). Покупець погоджується з офертою на checkout.
 *
 * До 24.09.2026 значок на сторінці товару казав «Повернення 14 днів — без зайвих
 * питань», FAQ — «протягом 14 днів ви можете повернути товар», а схема для
 * Google — MerchantReturnFiniteReturnWindow. Усе це суперечило договору.
 */
const RETURN_WINDOW_PROMISE = /\d+[\s-]*(днів|дні|day)|без зайвих питань|no questions asked/i;

describe("тексти про повернення не суперечать оферті", () => {
  for (const [locale, messages] of [["uk", uk], ["en", en]] as const) {
    it(`${locale}: значок і FAQ на сторінці товару не обіцяють повернення`, () => {
      const texts = {
        trustInspectTitle: messages.product.trustInspectTitle,
        trustInspectDesc: messages.product.trustInspectDesc,
        "productFaq.a3": messages.productFaq.a3,
      };
      for (const [key, text] of Object.entries(texts)) {
        expect(text, key).toBeTruthy();
        expect(text, key).not.toMatch(RETURN_WINDOW_PROMISE);
      }
    });
  }
});
