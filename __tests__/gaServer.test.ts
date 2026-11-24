import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fakeSupabase, type FakeSupabase } from "./helpers/fakeSupabase";

const db = vi.hoisted(() => ({ current: null as FakeSupabase | null }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => db.current!.client,
}));

import {
  browserShouldReportPurchase,
  gaSessionCookieName,
  parseGaClientId,
  parseGaSessionId,
  readGaIds,
  reportPurchaseFromServer,
} from "@/lib/ga-server";

const ORDER_ID = "11111111-1111-4111-8111-111111111111";

function paidCardOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: ORDER_ID,
    status: "paid",
    payment_type: "card",
    payment_status: "success",
    total: 900,
    ga_client_id: "123456789.1764000000",
    ga_session_id: "1764000100",
    ga_purchase_sent_at: null,
    ga_purchase_sent_by: null,
    order_items: [
      { product_id: "p1", quantity: 2, price: 450, products: { name: "Шампунь Harmony" } },
    ],
    ...overrides,
  };
}

const fetchMock = vi.fn();

function useOrders(rows: Record<string, unknown>[], options?: { missingColumns?: string[] }) {
  db.current = fakeSupabase({ orders: rows }, options);
  return db.current;
}

function sentBody() {
  const [, init] = fetchMock.mock.calls[0];
  return JSON.parse(init.body as string);
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, status: 204 });
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
  vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-TEST123");
  vi.stubEnv("GA_MEASUREMENT_PROTOCOL_SECRET", "made-up-secret");
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GA cookies", () => {
  it("client id — це дві останні частини _ga", () => {
    expect(parseGaClientId("GA1.1.123456789.1764000000")).toBe("123456789.1764000000");
    expect(parseGaClientId("GA1.2.987654321.1700000000")).toBe("987654321.1700000000");
  });

  it("сміття в _ga не стає client id", () => {
    expect(parseGaClientId(undefined)).toBeNull();
    expect(parseGaClientId("")).toBeNull();
    expect(parseGaClientId("GA1.1.amp-abc")).toBeNull();
    expect(parseGaClientId("123456789.1764000000")).toBeNull();
  });

  it("ім'я кукі сесії — _ga_ і id потоку без G-", () => {
    expect(gaSessionCookieName("G-TEST123")).toBe("_ga_TEST123");
    expect(gaSessionCookieName(undefined)).toBeNull();
    expect(gaSessionCookieName("UA-1-1")).toBeNull();
  });

  it("session id читається зі старого (GS1) і нового (GS2) формату", () => {
    expect(parseGaSessionId("GS1.1.1746825440.14.0.1746825490.0.0.0")).toBe("1746825440");
    expect(parseGaSessionId("GS2.1.s1746825440$o14$g0$t1746825490$j0$l0$h0")).toBe("1746825440");
  });

  it("невідомий формат кукі сесії дає null, а не вигаданий id", () => {
    expect(parseGaSessionId("GS3.1.whatever")).toBeNull();
    expect(parseGaSessionId("GS2.1.o14$g0$t1746825490")).toBeNull();
    expect(parseGaSessionId("GS1.1.abc.1.0")).toBeNull();
    expect(parseGaSessionId(undefined)).toBeNull();
  });

  it("readGaIds бере обидва id з кукі запиту", () => {
    const jar = new Map([
      ["_ga", { value: "GA1.1.123456789.1764000000" }],
      ["_ga_TEST123", { value: "GS2.1.s1764000100$o1$g1$t1764000200$j0$l0$h0" }],
      ["_ga_OTHER", { value: "GS2.1.s999$o1" }],
    ]);
    expect(readGaIds(jar, "G-TEST123")).toEqual({
      clientId: "123456789.1764000000",
      sessionId: "1764000100",
    });
  });

  it("без _ga сесію не зберігаємо", () => {
    const jar = new Map([["_ga_TEST123", { value: "GS1.1.1764000100.1.1.1764000200.0.0.0" }]]);
    expect(readGaIds(jar, "G-TEST123")).toEqual({ clientId: null, sessionId: null });
  });
});

describe("reportPurchaseFromServer", () => {
  it("надсилає purchase через Measurement Protocol і позначає замовлення", async () => {
    const fake = useOrders([paidCardOrder()]);

    expect(await reportPurchaseFromServer(ORDER_ID)).toBe("sent");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://www.google-analytics.com/mp/collect?measurement_id=G-TEST123&api_secret=made-up-secret"
    );
    expect(init.method).toBe("POST");
    expect(sentBody()).toEqual({
      client_id: "123456789.1764000000",
      events: [
        {
          name: "purchase",
          params: {
            transaction_id: ORDER_ID,
            value: 900,
            currency: "UAH",
            shipping: 0,
            tax: 0,
            items: [{ item_id: "p1", item_name: "Шампунь Harmony", price: 450, quantity: 2 }],
            session_id: "1764000100",
            engagement_time_msec: 1,
          },
        },
      ],
    });
    expect(fake.tables.orders[0].ga_purchase_sent_by).toBe("server");
    expect(fake.tables.orders[0].ga_purchase_sent_at).toEqual(expect.any(String));
  });

  it("без session id подія все одно йде, лише без session_id", async () => {
    useOrders([paidCardOrder({ ga_session_id: null })]);
    expect(await reportPurchaseFromServer(ORDER_ID)).toBe("sent");
    expect(sentBody().events[0].params).not.toHaveProperty("session_id");
  });

  it("друга спроба не надсилає вдруге", async () => {
    useOrders([paidCardOrder()]);
    await reportPurchaseFromServer(ORDER_ID);
    expect(await reportPurchaseFromServer(ORDER_ID)).toBe("already_reported");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("дві одночасні спроби — лише одна відправка", async () => {
    useOrders([paidCardOrder()]);
    const results = await Promise.all([
      reportPurchaseFromServer(ORDER_ID),
      reportPurchaseFromServer(ORDER_ID),
    ]);
    expect(results.sort()).toEqual(["already_reported", "sent"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("без client id не вигадуємо його і нічого не надсилаємо", async () => {
    const fake = useOrders([paidCardOrder({ ga_client_id: null })]);
    expect(await reportPurchaseFromServer(ORDER_ID)).toBe("no_client_id");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(fake.tables.orders[0].ga_purchase_sent_at).toBeNull();
  });

  it("неоплачене замовлення не стає purchase", async () => {
    useOrders([paidCardOrder({ status: "pending" })]);
    expect(await reportPurchaseFromServer(ORDER_ID)).toBe("not_paid");
    useOrders([paidCardOrder({ status: "cancelled" })]);
    expect(await reportPurchaseFromServer(ORDER_ID)).toBe("not_paid");
    useOrders([paidCardOrder({ payment_type: "callback", status: "processing" })]);
    expect(await reportPurchaseFromServer(ORDER_ID)).toBe("not_paid");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("тестова оплата LiqPay (sandbox) не йде в GA як дохід", async () => {
    useOrders([paidCardOrder({ payment_status: "sandbox" })]);
    expect(await reportPurchaseFromServer(ORDER_ID)).toBe("sandbox");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("без API secret нічого не робить і не чіпає замовлення", async () => {
    vi.stubEnv("GA_MEASUREMENT_PROTOCOL_SECRET", "");
    const fake = useOrders([paidCardOrder()]);
    expect(await reportPurchaseFromServer(ORDER_ID)).toBe("not_configured");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(fake.updates).toHaveLength(0);
  });

  it("GA недоступний — без винятку, позначку знято", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    const fake = useOrders([paidCardOrder()]);
    expect(await reportPurchaseFromServer(ORDER_ID)).toBe("failed");
    expect(fake.tables.orders[0].ga_purchase_sent_at).toBeNull();
    expect(fake.tables.orders[0].ga_purchase_sent_by).toBeNull();
  });

  it("GA відповів помилкою HTTP — теж failed, позначку знято", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    const fake = useOrders([paidCardOrder()]);
    expect(await reportPurchaseFromServer(ORDER_ID)).toBe("failed");
    expect(fake.tables.orders[0].ga_purchase_sent_at).toBeNull();
  });

  it("до міграції 015 (колонок ще нема) — без винятку і без відправки", async () => {
    useOrders([paidCardOrder()], { missingColumns: ["ga_client_id", "ga_purchase_sent_at"] });
    expect(await reportPurchaseFromServer(ORDER_ID)).toBe("unavailable");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("browserShouldReportPurchase (сторінка успіху)", () => {
  it("сервер надіслав — браузер мовчить", async () => {
    useOrders([paidCardOrder()]);
    expect(await browserShouldReportPurchase(ORDER_ID)).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("callback уже надіслав — браузер мовчить і сервер не повторює", async () => {
    useOrders([paidCardOrder()]);
    await reportPurchaseFromServer(ORDER_ID);
    expect(await browserShouldReportPurchase(ORDER_ID)).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("без API secret — браузер звітує, як раніше, і займає замовлення", async () => {
    vi.stubEnv("GA_MEASUREMENT_PROTOCOL_SECRET", "");
    const fake = useOrders([paidCardOrder()]);
    expect(await browserShouldReportPurchase(ORDER_ID)).toBe(true);
    expect(fake.tables.orders[0].ga_purchase_sent_by).toBe("browser");

    // Секрет додали пізніше: пізній callback уже не продублює покупку.
    vi.stubEnv("GA_MEASUREMENT_PROTOCOL_SECRET", "made-up-secret");
    expect(await reportPurchaseFromServer(ORDER_ID)).toBe("already_reported");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("повторне відкриття сторінки не надсилає вдруге", async () => {
    useOrders([paidCardOrder({ ga_client_id: null })]);
    expect(await browserShouldReportPurchase(ORDER_ID)).toBe(true);
    expect(await browserShouldReportPurchase(ORDER_ID)).toBe(false);
  });

  it("GA недоступний із сервера — браузер пробує сам", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    const fake = useOrders([paidCardOrder()]);
    expect(await browserShouldReportPurchase(ORDER_ID)).toBe(true);
    expect(fake.tables.orders[0].ga_purchase_sent_by).toBe("browser");
  });

  it("до міграції 015 — браузер звітує, як раніше", async () => {
    useOrders([paidCardOrder()], { missingColumns: ["ga_client_id", "ga_purchase_sent_at"] });
    expect(await browserShouldReportPurchase(ORDER_ID)).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
