import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { fakeSupabase, type FakeSupabase } from "./helpers/fakeSupabase";
import { makeSignature } from "@/lib/liqpay";

const db = vi.hoisted(() => ({ current: null as FakeSupabase | null }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => db.current!.client,
}));

// The payment state machine has its own rules; here it only has to flip the
// order the way the real one does, so the GA side sees a paid order.
const settleOrderPayment = vi.hoisted(() => vi.fn());
vi.mock("@/lib/payments", () => ({ settleOrderPayment }));

import { POST } from "@/app/api/liqpay/callback/route";

const PRIVATE = "test_private_key";
const ORDER_ID = "22222222-2222-4222-8222-222222222222";

const fetchMock = vi.fn();

function pendingCardOrder() {
  return {
    id: ORDER_ID,
    status: "pending",
    payment_type: "card",
    payment_status: null,
    total: 900,
    ga_client_id: "123456789.1764000000",
    ga_session_id: "1764000100",
    ga_purchase_sent_at: null,
    ga_purchase_sent_by: null,
    order_items: [
      { product_id: "p1", quantity: 2, price: 450, products: { name: "Шампунь Harmony" } },
    ],
  };
}

function callback(status: string) {
  const data = Buffer.from(
    JSON.stringify({ status, order_id: ORDER_ID, amount: 900, currency: "UAH", payment_id: 1 })
  ).toString("base64");
  return new NextRequest("http://localhost/api/liqpay/callback", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ data, signature: makeSignature(data, PRIVATE) }).toString(),
  });
}

function gaPurchases() {
  return fetchMock.mock.calls.filter(([url]) => String(url).includes("/mp/collect"));
}

beforeEach(() => {
  db.current = fakeSupabase({ orders: [pendingCardOrder()] });

  settleOrderPayment.mockReset();
  settleOrderPayment.mockImplementation(async ({ status }: { status: string }) => {
    const order = db.current!.tables.orders[0];
    if (status !== "success") return { paid: false, transitioned: false, reason: "status_not_paid" };
    const transitioned = order.status === "pending";
    order.status = "paid";
    order.payment_status = status;
    return { paid: true, transitioned };
  });

  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, status: 204 });
  vi.stubGlobal("fetch", fetchMock);

  vi.stubEnv("LIQPAY_PRIVATE_KEY", PRIVATE);
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

describe("LiqPay callback → GA4 purchase", () => {
  it("оплачене замовлення потрапляє в GA як purchase з id замовлення", async () => {
    const res = await POST(callback("success"));

    expect(res.status).toBe(200);
    expect(gaPurchases()).toHaveLength(1);
    const body = JSON.parse(gaPurchases()[0][1].body);
    expect(body.client_id).toBe("123456789.1764000000");
    expect(body.events[0]).toMatchObject({
      name: "purchase",
      params: {
        transaction_id: ORDER_ID,
        value: 900,
        currency: "UAH",
        session_id: "1764000100",
        items: [{ item_id: "p1", item_name: "Шампунь Harmony", price: 450, quantity: 2 }],
      },
    });
    expect(db.current!.tables.orders[0].ga_purchase_sent_by).toBe("server");
  });

  it("повторний callback не надсилає purchase вдруге", async () => {
    await POST(callback("success"));
    const res = await POST(callback("success"));

    expect(res.status).toBe(200);
    expect(gaPurchases()).toHaveLength(1);
  });

  it("без API secret callback успішний, а в GA нічого не йде", async () => {
    vi.stubEnv("GA_MEASUREMENT_PROTOCOL_SECRET", "");
    const res = await POST(callback("success"));

    expect(res.status).toBe(200);
    expect(gaPurchases()).toHaveLength(0);
    // Left unclaimed, so the success page still reports it from the browser.
    expect(db.current!.tables.orders[0].ga_purchase_sent_at).toBeNull();
  });

  it("невдала оплата не надсилає purchase", async () => {
    const res = await POST(callback("failure"));

    expect(res.status).toBe(200);
    expect(gaPurchases()).toHaveLength(0);
    expect(db.current!.tables.orders[0].ga_purchase_sent_at).toBeNull();
  });

  it("callback про невдачу для вже оплаченого замовлення не надсилає purchase", async () => {
    // E.g. a late "reversed"/"failure" for an order paid earlier, before the
    // API secret existed: the callback itself must not report it.
    db.current!.tables.orders[0].status = "paid";
    const res = await POST(callback("reversed"));

    expect(res.status).toBe(200);
    expect(gaPurchases()).toHaveLength(0);
  });

  it("GA недоступний — callback усе одно 200, позначку знято", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    const res = await POST(callback("success"));

    expect(res.status).toBe(200);
    expect(gaPurchases()).toHaveLength(1);
    expect(db.current!.tables.orders[0].ga_purchase_sent_at).toBeNull();
  });

  it("GA відповів 5xx — callback усе одно 200", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 });
    const res = await POST(callback("success"));
    expect(res.status).toBe(200);
  });

  it("до міграції 015 callback працює, як раніше", async () => {
    db.current = fakeSupabase(
      { orders: [pendingCardOrder()] },
      { missingColumns: ["ga_client_id", "ga_purchase_sent_at"] }
    );
    const res = await POST(callback("success"));

    expect(res.status).toBe(200);
    expect(gaPurchases()).toHaveLength(0);
  });

  it("збій запису оплати — 500 (LiqPay повторить), і нічого не йде в GA", async () => {
    settleOrderPayment.mockRejectedValue(new Error("order_update_failed"));
    const res = await POST(callback("success"));

    expect(res.status).toBe(500);
    expect(gaPurchases()).toHaveLength(0);
  });
});
