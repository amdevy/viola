import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, createEvent } from "@testing-library/react";
import ProductCard from "@/components/shop/ProductCard";
import uk from "@/messages/uk.json";
import type { Product } from "@/types";

const { sendGAEvent, addItem, updateQuantity, openCart, showAddedToCart, cart } = vi.hoisted(() => ({
  sendGAEvent: vi.fn(),
  addItem: vi.fn(),
  updateQuantity: vi.fn(),
  openCart: vi.fn(),
  showAddedToCart: vi.fn(),
  cart: { quantity: 0 },
}));

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string, values?: Record<string, unknown>) => {
    const text = ((uk as Record<string, Record<string, string>>)[ns] ?? {})[key] ?? `${ns}.${key}`;
    return text.replace(/\{(\w+)\}/g, (_, name) => String(values?.[name] ?? ""));
  },
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

vi.mock("@/hooks/useCart", () => ({ useCart: () => ({ addItem, updateQuantity, openCart }) }));
vi.mock("@/hooks/useCartQuantity", () => ({ useCartQuantity: () => cart.quantity }));
vi.mock("@/components/shop/addedToCartToast", () => ({ showAddedToCart }));
vi.mock("@/lib/analytics", () => ({ sendGAEvent }));
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
    updateQuantity.mockClear();
    openCart.mockClear();
    showAddedToCart.mockClear();
    cart.quantity = 0;
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

  it("«В кошик» додає товар, лишає покупця на місці й не переходить на сторінку товару", () => {
    // Раніше після кожного додавання відкривався кошик — на телефоні на весь
    // екран, поверх каталогу. Тепер про додавання каже повідомлення з кнопкою
    // «Відкрити», а сам кошик не чіпаємо.
    render(<ProductCard product={product} />);

    const button = screen.getByRole("button", { name: uk.productCard.addToCart });
    const click = createEvent.click(button);
    fireEvent(button, click);

    expect(addItem).toHaveBeenCalledWith(expect.objectContaining({ productId: "p1", quantity: 1 }));
    expect(openCart).not.toHaveBeenCalled();
    expect(showAddedToCart).toHaveBeenCalledWith({
      title: uk.cart.added,
      detail: product.name,
      openLabel: uk.cart.openShort,
    });
    expect(sendGAEvent).toHaveBeenCalledWith("event", "add_to_cart", expect.anything());
    expect(click.defaultPrevented).toBe(true);
    expect(sendGAEvent).not.toHaveBeenCalledWith("event", "select_item", expect.anything());
  });

  it("поки товару немає в кошику, поруч стоїть «Консультація» з посиланням у Telegram", () => {
    render(<ProductCard product={product} />);

    expect(screen.getByRole("link", { name: uk.common.consultation })).toHaveAttribute(
      "href",
      "https://t.me/violagegedosh",
    );
    expect(screen.queryByRole("button", { name: uk.cart.open })).toBeNull();
  });

  it("смуга кнопок на фото: з sm ховається до наведення лише там, де є наведення", () => {
    const { container } = render(<ProductCard product={product} />);
    const strip = container.querySelector("[data-quick-strip]")!;

    // Both controls live in the strip over the photo.
    expect(strip).toContainElement(screen.getByRole("button", { name: uk.productCard.addToCart }));
    expect(strip).toContainElement(screen.getByRole("link", { name: uk.common.consultation }));
    // Pushed below the photo only on devices that can hover, and brought
    // back by hover or keyboard focus.
    expect(strip).toHaveClass(
      "sm:[@media(hover:hover)]:translate-y-full",
      "sm:group-hover:translate-y-0",
      "sm:group-focus-within:translate-y-0",
    );
  });

  it("«Консультація» шле telegram_consultation з товаром і не веде на сторінку товару", () => {
    render(<ProductCard product={product} />);
    const link = screen.getByRole("link", { name: uk.common.consultation });
    link.addEventListener("click", (e) => e.preventDefault());
    const click = createEvent.click(link);
    const bubbled = vi.fn();
    document.addEventListener("click", bubbled);
    fireEvent(link, click);
    document.removeEventListener("click", bubbled);

    expect(sendGAEvent).toHaveBeenCalledWith("event", "telegram_consultation", {
      source: "product_card",
      product_id: "p1",
      product_name: product.name,
    });
    expect(bubbled).not.toHaveBeenCalled();
  });

  it("товар уже в кошику: лічильник замість кнопки, «Консультація» лишається", () => {
    cart.quantity = 2;
    render(<ProductCard product={product} />);

    expect(screen.getByText("У кошику: 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: uk.cart.decrease })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: uk.cart.increase })).toBeInTheDocument();
    const consultation = screen.getByRole("link", { name: uk.common.consultation });
    expect(consultation).toHaveAttribute("href", "https://t.me/violagegedosh");
    // On a narrow card the counter takes the whole strip; on a wide one (strip ≥ 15rem) consultation stays.
    expect(consultation).toHaveClass("hidden", "@min-[15rem]:flex");
    // In the cart the strip is shown without hover.
    expect(document.querySelector("[data-quick-strip]")).not.toHaveClass(
      "sm:[@media(hover:hover)]:translate-y-full",
    );

    expect(screen.queryByRole("button", { name: uk.productCard.addToCart })).toBeNull();
    expect(screen.queryByRole("button", { name: uk.cart.open })).toBeNull();
  });

  it("«+» і «−» змінюють кількість на одиницю, без повідомлення й без переходу", () => {
    cart.quantity = 2;
    render(<ProductCard product={product} />);

    const plus = screen.getByRole("button", { name: uk.cart.increase });
    const plusClick = createEvent.click(plus);
    fireEvent(plus, plusClick);
    expect(updateQuantity).toHaveBeenLastCalledWith("p1", 3);
    expect(plusClick.defaultPrevented).toBe(true);
    expect(sendGAEvent).toHaveBeenLastCalledWith(
      "event",
      "add_to_cart",
      expect.objectContaining({ currency: "UAH", value: 650, items: [expect.objectContaining({ quantity: 1 })] }),
    );

    fireEvent.click(screen.getByRole("button", { name: uk.cart.decrease }));
    expect(updateQuantity).toHaveBeenLastCalledWith("p1", 1);
    expect(sendGAEvent).toHaveBeenLastCalledWith(
      "event",
      "remove_from_cart",
      expect.objectContaining({ currency: "UAH", value: 650, items: [expect.objectContaining({ quantity: 1 })] }),
    );

    expect(addItem).not.toHaveBeenCalled();
    expect(showAddedToCart).not.toHaveBeenCalled();
  });

  it("«−» на останній одиниці прибирає товар із кошика", () => {
    cart.quantity = 1;
    const { rerender } = render(<ProductCard product={product} />);

    fireEvent.click(screen.getByRole("button", { name: uk.cart.decrease }));
    expect(updateQuantity).toHaveBeenCalledWith("p1", 0);

    // The store drops the product; the strip is back to its two halves.
    cart.quantity = 0;
    rerender(<ProductCard product={product} />);
    expect(screen.getByRole("button", { name: uk.productCard.addToCart })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: uk.common.consultation })).not.toHaveClass("hidden");
    expect(screen.queryByRole("button", { name: uk.cart.decrease })).toBeNull();
  });

  it("товар не можна купити: «Сповістити мене», і «Консультація» лишається", () => {
    cart.quantity = 1;
    render(<ProductCard product={{ ...product, in_stock: false }} />);

    const notify = screen.getByRole("button", { name: uk.common.notifyMe });
    fireEvent.click(notify);
    expect(addItem).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: uk.cart.increase })).toBeNull();
    expect(screen.getByRole("link", { name: uk.common.consultation })).not.toHaveClass("hidden");
  });

  it("клік по назві шле select_item у GA", () => {
    render(<ProductCard product={product} />);

    // jsdom не вміє переходити на інший документ і лаявся б у консоль на кожен
    // прогін; тут перевіряємо лише подію, тож сам перехід скасовуємо.
    const link = screen.getByRole("link", { name: product.name });
    link.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(link);

    expect(sendGAEvent).toHaveBeenCalledWith(
      "event",
      "select_item",
      expect.objectContaining({ items: [expect.objectContaining({ item_id: "p1" })] }),
    );
  });
});
