import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CheckoutSummary from "@/app/(public)/[locale]/checkout/CheckoutSummary";
import { useCart } from "@/hooks/useCart";
import uk from "@/messages/uk.json";

const { sendGAEvent } = vi.hoisted(() => ({ sendGAEvent: vi.fn() }));

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) =>
    ((uk as Record<string, Record<string, string>>)[ns] ?? {})[key] ?? `${ns}.${key}`,
  useLocale: () => "uk",
}));

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("@/lib/analytics", () => ({ sendGAEvent }));

const ITEM = { productId: "a", name: "Колагеновий шампунь", price: 900, image: "", quantity: 1 };

describe("CheckoutSummary — «Ваше замовлення» над формою", () => {
  beforeEach(() => {
    sendGAEvent.mockClear();
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query }));
  });

  it("веде до форми: прокручує до #checkout-form і шле подію", () => {
    useCart.setState({ items: [ITEM] });
    const form = document.createElement("form");
    form.id = "checkout-form";
    form.scrollIntoView = vi.fn();
    document.body.appendChild(form);

    render(<CheckoutSummary />);
    fireEvent.click(screen.getByRole("button", { name: uk.checkout.goToForm }));

    expect(form.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(sendGAEvent).toHaveBeenCalledWith("event", "select_content", {
      content_type: "checkout_go_to_form",
      content_id: "order_summary",
    });
    form.remove();
  });

  it("з порожнім кошиком кнопки немає", () => {
    useCart.setState({ items: [] });
    render(<CheckoutSummary />);
    expect(screen.queryByRole("button", { name: uk.checkout.goToForm })).toBeNull();
  });
});
