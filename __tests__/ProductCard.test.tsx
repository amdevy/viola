import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, createEvent } from "@testing-library/react";
import ProductCard from "@/components/shop/ProductCard";
import uk from "@/messages/uk.json";
import type { Product } from "@/types";

const { sendGAEvent, addItem, openCart } = vi.hoisted(() => ({
  sendGAEvent: vi.fn(),
  addItem: vi.fn(),
  openCart: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) =>
    ((uk as Record<string, Record<string, string>>)[ns] ?? {})[key] ?? `${ns}.${key}`,
  useLocale: () => "uk",
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("@/hooks/useCart", () => ({ useCart: () => ({ addItem, openCart }) }));
vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@next/third-parties/google", () => ({ sendGAEvent }));
vi.mock("@/components/shop/StockNotifyModal", () => ({ default: () => null }));
vi.mock("@/components/shop/ProductLikeButton", () => ({
  default: () => <button type="button">♥</button>,
}));

const product: Product = {
  id: "p1",
  slug: "kolahenovyy-shampun-dlya-volossya",
  name: "Колагеновий шампунь для волосся",
  description: null,
  ingredients: null,
  how_to_use: null,
  price: 650,
  compare_price: null,
  images: ["/a.jpg"],
  category_id: "c1",
  in_stock: true,
  is_new: false,
  is_coming_soon: false,
  is_bestseller: false,
  benefits: [],
  likes_count: 0,
  volume: "250 мл",
  hair_type: [],
  created_at: "2026-01-01T00:00:00Z",
};

describe("ProductCard — посилання на товар у розмітці", () => {
  beforeEach(() => {
    sendGAEvent.mockClear();
    addItem.mockClear();
    openCart.mockClear();
  });

  it("веде на товар справжнім <a href>, а не div з onClick", () => {
    // Доки картка була <div role="link" onClick={router.push}>, у серверному
    // HTML не було жодного посилання на товар: Google знаходив їх лише через
    // sitemap і 30+ товарів лишались "Discovered – currently not indexed".
    render(<ProductCard product={product} />);

    const link = screen.getByRole("link", { name: product.name });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/shop/kolahenovyy-shampun-dlya-volossya");
    expect(document.querySelector('[role="link"]')).toBeNull();
  });

  it("«В кошик» додає товар і не переходить на сторінку товару", () => {
    render(<ProductCard product={product} />);

    const button = screen.getByRole("button", { name: "В кошик" });
    const click = createEvent.click(button);
    fireEvent(button, click);

    expect(addItem).toHaveBeenCalledWith(expect.objectContaining({ productId: "p1", quantity: 1 }));
    expect(openCart).toHaveBeenCalled();
    expect(click.defaultPrevented).toBe(true);
    expect(sendGAEvent).not.toHaveBeenCalledWith("event", "select_item", expect.anything());
  });

  it("клік по назві шле select_item у GA", () => {
    render(<ProductCard product={product} />);

    fireEvent.click(screen.getByRole("link", { name: product.name }));

    expect(sendGAEvent).toHaveBeenCalledWith(
      "event",
      "select_item",
      expect.objectContaining({ items: [expect.objectContaining({ item_id: "p1" })] }),
    );
  });
});
