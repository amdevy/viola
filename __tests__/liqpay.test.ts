import { describe, it, expect, afterEach, vi } from "vitest";
import {
  amountMatches,
  assertLiqPayEnv,
  buildCheckout,
  decodeCallback,
  encodeData,
  isSandboxKey,
  LIQPAY_PAID_STATUSES,
  isInFlight,
  isTerminalFailure,
  makeSignature,
  verifyCallback,
  type LiqPayParams,
} from "@/lib/liqpay";

const PRIVATE = "test_private_key";

const params: LiqPayParams = {
  public_key: "test_public_key",
  version: 3,
  action: "pay",
  amount: 450,
  currency: "UAH",
  description: "Замовлення #1 — Viola",
  order_id: "11111111-1111-1111-1111-111111111111",
  language: "uk",
  sandbox: 0,
};

afterEach(() => {
  vi.unstubAllEnvs();
});

function setEnv(env: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
}

describe("signature round-trip", () => {
  it("підпис, згенерований для checkout, проходить перевірку callback", () => {
    const { data, signature } = buildCheckout(params, PRIVATE);
    expect(verifyCallback(data, signature, PRIVATE)).toBe(true);
  });

  it("payload декодується назад у ті самі параметри", () => {
    const data = encodeData(params);
    expect(decodeCallback<LiqPayParams>(data)).toEqual(params);
  });

  it("підроблений payload відхиляється", () => {
    const { signature } = buildCheckout(params, PRIVATE);
    const tampered = encodeData({ ...params, amount: 1 });
    expect(verifyCallback(tampered, signature, PRIVATE)).toBe(false);
  });

  it("чужий приватний ключ відхиляється", () => {
    const { data } = buildCheckout(params, PRIVATE);
    const forged = makeSignature(data, "attacker_key");
    expect(verifyCallback(data, forged, PRIVATE)).toBe(false);
  });

  it("підпис некоректної довжини не валить порівняння", () => {
    const { data } = buildCheckout(params, PRIVATE);
    expect(verifyCallback(data, "short", PRIVATE)).toBe(false);
    expect(verifyCallback(data, "", PRIVATE)).toBe(false);
  });
});

describe("amountMatches", () => {
  it("приймає збіг і копійчану похибку", () => {
    expect(amountMatches(450, 450)).toBe(true);
    expect(amountMatches("450.00", 450)).toBe(true);
    expect(amountMatches(450.005, 450)).toBe(true);
  });

  it("відхиляє недоплату — саме той сценарій, що дозволяв платити 1 грн", () => {
    expect(amountMatches(1, 5000)).toBe(false);
    expect(amountMatches(449.5, 450)).toBe(false);
  });

  it("відхиляє нечислові значення", () => {
    expect(amountMatches(undefined, 450)).toBe(false);
    expect(amountMatches(null, 450)).toBe(false);
    expect(amountMatches("нема", 450)).toBe(false);
  });
});

describe("статуси", () => {
  it("wait_accept не вважається оплатою — кошти ще можуть повернутись платнику", () => {
    expect(LIQPAY_PAID_STATUSES.has("wait_accept")).toBe(false);
    expect(isInFlight("wait_accept")).toBe(true);
  });

  it("проміжні 3DS-статуси не є ні оплатою, ні відмовою", () => {
    for (const s of ["processing", "wait_secure", "3ds_verify", "otp_verify"]) {
      expect(LIQPAY_PAID_STATUSES.has(s)).toBe(false);
      expect(isTerminalFailure(s)).toBe(false);
      expect(isInFlight(s)).toBe(true);
    }
  });

  it("термінальні відмови розпізнаються", () => {
    for (const s of ["failure", "error", "reversed", "expired"]) {
      expect(LIQPAY_PAID_STATUSES.has(s)).toBe(false);
      expect(isTerminalFailure(s)).toBe(true);
      expect(isInFlight(s)).toBe(false);
    }
  });

  it("НЕВІДОМИЙ статус вважається таким, що в процесі, а не відмовою", () => {
    // Це і є суть інверсії: словник статусів LiqPay росте (senderapp_verify,
    // password_verify, wait_compensation…). Показати невідомий статус як
    // «не пройшло» — значить запропонувати повтор і списати гроші двічі.
    for (const s of ["senderapp_verify", "password_verify", "wait_compensation", "щось_нове"]) {
      expect(isTerminalFailure(s)).toBe(false);
      expect(isInFlight(s)).toBe(true);
    }
  });

  it("оплачені статуси не вважаються ні відмовою, ні незавершеними", () => {
    for (const s of ["success", "sandbox"]) {
      expect(isTerminalFailure(s)).toBe(false);
      expect(isInFlight(s)).toBe(false);
    }
  });
});

describe("assertLiqPayEnv", () => {
  it("розпізнає sandbox-ключ", () => {
    expect(isSandboxKey("sandbox_i123")).toBe(true);
    expect(isSandboxKey("i123")).toBe(false);
    expect(isSandboxKey(undefined)).toBe(false);
  });

  it("у продакшні відмовляє на sandbox-ключах", () => {
    setEnv({
      NODE_ENV: "production",
      LIQPAY_PUBLIC_KEY: "sandbox_i123",
      LIQPAY_PRIVATE_KEY: "sandbox_secret",
      NEXT_PUBLIC_SITE_URL: "https://violamukachevo.com",
      LIQPAY_ALLOW_SANDBOX: undefined,
    });
    expect(() => assertLiqPayEnv()).toThrow(/sandbox/i);
  });

  it("LIQPAY_ALLOW_SANDBOX=1 свідомо дозволяє sandbox у продакшні", () => {
    setEnv({
      NODE_ENV: "production",
      LIQPAY_PUBLIC_KEY: "sandbox_i123",
      LIQPAY_PRIVATE_KEY: "sandbox_secret",
      NEXT_PUBLIC_SITE_URL: "https://violamukachevo.com",
      LIQPAY_ALLOW_SANDBOX: "1",
    });
    expect(assertLiqPayEnv().publicKey).toBe("sandbox_i123");
  });

  it("будь-яке інше значення прапорця не відкриває sandbox — тільки рівно \"1\"", () => {
    for (const value of ["0", "true", "yes", ""]) {
      setEnv({
        NODE_ENV: "production",
        LIQPAY_PUBLIC_KEY: "sandbox_i123",
        LIQPAY_PRIVATE_KEY: "sandbox_secret",
        NEXT_PUBLIC_SITE_URL: "https://violamukachevo.com",
        LIQPAY_ALLOW_SANDBOX: value,
      });
      expect(() => assertLiqPayEnv()).toThrow(/sandbox/i);
    }
  });

  it("прапорець не скасовує перевірку URL — callback усе одно має куди прийти", () => {
    setEnv({
      NODE_ENV: "production",
      LIQPAY_PUBLIC_KEY: "sandbox_i123",
      LIQPAY_PRIVATE_KEY: "sandbox_secret",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      LIQPAY_ALLOW_SANDBOX: "1",
    });
    expect(() => assertLiqPayEnv()).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("у продакшні відмовляє на localhost-URL — callback туди не дійде", () => {
    setEnv({
      NODE_ENV: "production",
      LIQPAY_PUBLIC_KEY: "i123",
      LIQPAY_PRIVATE_KEY: "secret",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    });
    expect(() => assertLiqPayEnv()).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("локально sandbox дозволений", () => {
    setEnv({
      NODE_ENV: "development",
      LIQPAY_PUBLIC_KEY: "sandbox_i123",
      LIQPAY_PRIVATE_KEY: "sandbox_secret",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    });
    expect(assertLiqPayEnv().publicKey).toBe("sandbox_i123");
  });

  it("падає, коли ключі не налаштовані", () => {
    setEnv({
      NODE_ENV: "development",
      LIQPAY_PUBLIC_KEY: undefined,
      LIQPAY_PRIVATE_KEY: undefined,
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    });
    expect(() => assertLiqPayEnv()).toThrow(/LIQPAY/);
  });

  it("прибирає кінцевий слеш із SITE_URL, щоб не з'явився подвійний", () => {
    setEnv({
      NODE_ENV: "development",
      LIQPAY_PUBLIC_KEY: "i123",
      LIQPAY_PRIVATE_KEY: "secret",
      NEXT_PUBLIC_SITE_URL: "https://violamukachevo.com/",
    });
    expect(assertLiqPayEnv().siteUrl).toBe("https://violamukachevo.com");
  });
});
