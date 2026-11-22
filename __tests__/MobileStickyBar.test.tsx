import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MobileStickyBar from "@/components/shop/MobileStickyBar";
import uk from "@/messages/uk.json";
import type { Product } from "@/types";

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) =>
    ((uk as Record<string, Record<string, string>>)[ns] ?? {})[key] ?? `${ns}.${key}`,
  useLocale: () => "uk",
}));

vi.mock("@/lib/analytics", () => ({ sendGAEvent: vi.fn() }));
vi.mock("@/components/shop/addedToCartToast", () => ({ showAddedToCart: vi.fn() }));
vi.mock("@/components/shop/StockNotifyModal", () => ({ default: () => null }));

const product = {
  id: "p1",
  slug: "kolahenovyy-shampun",
  name: "Колагеновий шампунь",
  price: 650,
  images: [],
  in_stock: true,
  is_coming_soon: false,
  volume: null,
} as unknown as Product;

// jsdom has no layout: the bar's own box and the footer's position are stubbed.
// The bar's lower edge (offsetTop + offsetHeight) is at 755px, the top of the
// bottom navigation on a 812px phone.
const layout = { footerTop: 3000 };
const descriptors = {
  offsetTop: Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetTop"),
  offsetHeight: Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight"),
};

function scrollTo(y: number, footerTop: number) {
  layout.footerTop = footerTop;
  Object.defineProperty(window, "scrollY", { configurable: true, value: y });
  fireEvent.scroll(window);
}

describe("MobileStickyBar — панель покупки на телефоні", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetTop", { configurable: true, get: () => 686 });
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, get: () => 69 });
    document.body.innerHTML = "";
    const footer = document.createElement("footer");
    footer.getBoundingClientRect = () => ({ top: layout.footerTop }) as DOMRect;
    document.body.appendChild(footer);
  });

  afterEach(() => {
    if (descriptors.offsetTop) Object.defineProperty(HTMLElement.prototype, "offsetTop", descriptors.offsetTop);
    if (descriptors.offsetHeight) Object.defineProperty(HTMLElement.prototype, "offsetHeight", descriptors.offsetHeight);
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  });

  const bar = () =>
    screen.getByText(uk.productCard.addToCartFull).closest("[aria-hidden]")!;

  it("з'являється після прокрутки, ховається над футером і вертається, коли футер знову внизу", () => {
    render(<MobileStickyBar product={product} />);
    expect(bar()).toHaveAttribute("aria-hidden", "true");

    scrollTo(600, 3000);
    expect(bar()).toHaveAttribute("aria-hidden", "false");

    // Footer reaches the strip the bar sits in: its last links must be tappable.
    scrollTo(2400, 700);
    expect(bar()).toHaveAttribute("aria-hidden", "true");

    // Scrolled back up, the footer is below the bar again.
    scrollTo(2000, 900);
    expect(bar()).toHaveAttribute("aria-hidden", "false");
  });
});
