import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OrderForm from "@/components/checkout/OrderForm";
import { useCart } from "@/hooks/useCart";
import { useCardPaymentUnlock } from "@/hooks/useCardPaymentUnlock";
import { sendGAEvent } from "@next/third-parties/google";
import uk from "@/messages/uk.json";

const pushMock = vi.hoisted(() => vi.fn());

vi.mock("next-intl", () => {
  const makeT = (ns: string) => {
    const dict = (uk as Record<string, Record<string, string>>)[ns] ?? {};
    const t = (key: string) => dict[key] ?? `${ns}.${key}`;
    // t.rich renders tags as React elements in the app; for assertions the
    // plain text is enough.
    t.rich = (key: string) => (dict[key] ?? `${ns}.${key}`).replace(/<\/?[a-z]+>/gi, "");
    return t;
  };
  return {
    useTranslations: (ns: string) => makeT(ns),
    useLocale: () => "uk",
  };
});

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@next/third-parties/google", () => ({
  sendGAEvent: vi.fn(),
}));

const KYIV = { Ref: "kyiv-ref", Description: "Київ", DescriptionRu: "Киев", AreaDescription: "Київська" };
const WAREHOUSE = { Ref: "wh-1", Description: "Відділення №1: вул. Хрещатик, 1", Number: "1", CityRef: "kyiv-ref", CityDescription: "Київ" };

type RecordedCall = { url: string; body?: Record<string, unknown> };
let fetchCalls: RecordedCall[] = [];

function jsonResponse(data: unknown) {
  return { ok: true, json: async () => data } as Response;
}

function installFetchMock() {
  fetchCalls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const u = String(url);
      fetchCalls.push({ url: u, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      if (u.includes("type=cities")) return jsonResponse({ data: [KYIV] });
      if (u.includes("type=warehouses")) return jsonResponse({ data: [WAREHOUSE] });
      if (u.includes("/api/orders")) return jsonResponse({ orderId: "test-order-1", total: 450 });
      if (u.includes("/api/abandoned-checkout")) return jsonResponse({ ok: true });
      if (u.includes("/api/notify-callback")) return jsonResponse({ ok: true });
      if (u.includes("/api/liqpay/checkout"))
        return jsonResponse({
          data: "ZGF0YQ==",
          signature: "sig",
          action: "https://www.liqpay.ua/api/3/checkout",
        });
      return jsonResponse({});
    })
  );
}

const calledUrls = () => fetchCalls.map((c) => c.url);

/** Fills every required field and ticks the offer checkbox. */
async function fillValidCheckout(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(uk.checkout.firstName), "Олена");
  await user.type(screen.getByLabelText(uk.checkout.lastName), "Іваненко");
  await user.type(screen.getByLabelText(uk.checkout.phone), "050 123 45 67");

  const cityInput = screen.getByPlaceholderText(uk.checkout.cityPlaceholder);
  await user.type(cityInput, "Київ");
  await screen.findByRole("button", { name: /Київська/ }, { timeout: 3000 });
  fireEvent.blur(cityInput);

  const warehouseInput = await screen.findByPlaceholderText(
    uk.checkout.warehousePlaceholder,
    {},
    { timeout: 3000 }
  );
  await user.click(warehouseInput);
  const whOption = await screen.findByRole("button", { name: /Хрещатик/ }, { timeout: 3000 });
  await user.click(whOption);

  await user.click(screen.getByRole("checkbox"));
}

describe("OrderForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installFetchMock();
    useCardPaymentUnlock.setState({ unlocked: false, taps: 0, lastTapAt: 0 });
    useCart.setState({
      items: [{ productId: "p1", name: "Шампунь Harmony", price: 450, image: "/img.jpg", quantity: 1 }],
    });
  });

  it("оплата карткою прихована, поки її не розблоковано", async () => {
    render(<OrderForm />);
    await waitFor(() =>
      expect(screen.getByText(uk.checkout.callback)).toBeInTheDocument()
    );
    expect(screen.queryByText(uk.checkout.card)).not.toBeInTheDocument();
    expect(document.querySelector('input[value="card"]')).toBeNull();
  });

  it("порожній сабміт: показує підсумок помилок, шле GA-подію, фокусує перше поле і НЕ шле замовлення", async () => {
    const user = userEvent.setup();
    render(<OrderForm />);

    await user.click(screen.getByRole("button", { name: uk.checkout.submit }));

    expect(await screen.findByText(uk.checkout.formHasErrors)).toBeInTheDocument();

    await waitFor(() => {
      expect(sendGAEvent).toHaveBeenCalledWith(
        "event",
        "form_validation_error",
        expect.objectContaining({ form_name: "checkout", fields: expect.stringContaining("firstName") })
      );
    });

    expect(screen.getByLabelText(uk.checkout.firstName)).toHaveFocus();

    expect(calledUrls().some((u) => u.includes("/api/orders"))).toBe(false);
    expect(calledUrls().some((u) => u.includes("/api/notify-callback"))).toBe(false);
  });

  it("невалідний телефон: помилка з'являється одразу після виходу з поля, без сабміту", async () => {
    const user = userEvent.setup();
    render(<OrderForm />);

    const phoneInput = screen.getByLabelText(uk.checkout.phone);
    await user.type(phoneInput, "123");
    await user.tab();

    expect(await screen.findByText(uk.checkout.errPhone)).toBeInTheDocument();
  });

  it("закордонний телефон приймається без помилки", async () => {
    const user = userEvent.setup();
    render(<OrderForm />);

    const phoneInput = screen.getByLabelText(uk.checkout.phone);
    await user.type(phoneInput, "+49 151 23456789");
    await user.tab();

    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText(uk.checkout.errPhone)).not.toBeInTheDocument();
  });

  it("без згоди з офертою замовлення не відправляється", async () => {
    const user = userEvent.setup();
    render(<OrderForm />);

    await user.click(screen.getByRole("button", { name: uk.checkout.submit }));

    expect(await screen.findByText(uk.checkout.errOffer)).toBeInTheDocument();
    expect(calledUrls().some((u) => u.includes("/api/orders"))).toBe(false);
  }, 15000);

  it("надруковане, але не клікнуте місто більше не блокує замовлення (повний флоу)", async () => {
    const user = userEvent.setup();
    render(<OrderForm />);

    await fillValidCheckout(user);
    await user.click(screen.getByRole("button", { name: uk.checkout.submit }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/checkout/success?orderId=test-order-1"), {
      timeout: 3000,
    });

    const orderCall = fetchCalls.find((c) => c.url.includes("/api/orders"));
    expect(orderCall).toBeDefined();
    expect(orderCall?.body).toMatchObject({
      firstName: "Олена",
      phone: "+380501234567",
      city: "Київ",
      novaPoshtaRef: "wh-1",
      acceptOffer: true,
    });

    expect(calledUrls().some((u) => u.includes("/api/notify-callback"))).toBe(true);
    expect(screen.queryByText(uk.checkout.formHasErrors)).not.toBeInTheDocument();
  }, 15000);

  it("замовлення не несе жодної ціни — сервер рахує суму сам", async () => {
    const user = userEvent.setup();
    render(<OrderForm />);

    await fillValidCheckout(user);
    await user.click(screen.getByRole("button", { name: uk.checkout.submit }));

    await waitFor(() => expect(pushMock).toHaveBeenCalled(), { timeout: 3000 });

    const body = fetchCalls.find((c) => c.url.includes("/api/orders"))?.body as {
      total?: unknown;
      items: { productId: string; quantity: number; price?: unknown }[];
    };

    // The whole point of the server-side pricing fix: a tampered cart must not
    // be able to influence what gets charged.
    expect(body.total).toBeUndefined();
    expect(body.items).toEqual([{ productId: "p1", quantity: 1 }]);
    for (const item of body.items) expect(item.price).toBeUndefined();
  }, 15000);

  it("карткова оплата: у LiqPay-ініціалізацію йде лише orderId", async () => {
    const submitSpy = vi
      .spyOn(HTMLFormElement.prototype, "submit")
      .mockImplementation(() => {});
    useCardPaymentUnlock.setState({ unlocked: true });
    const user = userEvent.setup();
    render(<OrderForm />);

    await fillValidCheckout(user);

    const cardRadio = await waitFor(() => {
      const el = document.querySelector('input[value="card"]');
      if (!el) throw new Error("card option not rendered");
      return el as HTMLInputElement;
    });
    fireEvent.click(cardRadio);

    await user.click(screen.getByRole("button", { name: uk.checkout.submitPay }));

    await waitFor(
      () => expect(calledUrls().some((u) => u.includes("/api/liqpay/checkout"))).toBe(true),
      { timeout: 3000 }
    );

    const lpCall = fetchCalls.find((c) => c.url.includes("/api/liqpay/checkout"));
    expect(lpCall?.body).toEqual({ orderId: "test-order-1" });

    // A card order must not be announced as a completed order before payment,
    // and must not be excluded from abandoned-cart recovery yet.
    expect(calledUrls().some((u) => u.includes("/api/notify-callback"))).toBe(false);
    expect(calledUrls().some((u) => u.includes("/api/abandoned-checkout") )).toBe(
      fetchCalls.some(
        (c) =>
          c.url.includes("/api/abandoned-checkout") &&
          (c.body as { action?: string } | undefined)?.action === "capture"
      )
    );
    expect(
      fetchCalls.some(
        (c) =>
          c.url.includes("/api/abandoned-checkout") &&
          (c.body as { action?: string } | undefined)?.action === "ordered"
      )
    ).toBe(false);

    await waitFor(() => expect(submitSpy).toHaveBeenCalled(), { timeout: 3000 });
    submitSpy.mockRestore();
  }, 15000);
});
