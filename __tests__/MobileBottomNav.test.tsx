import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { useCart } from "@/hooks/useCart";
import uk from "@/messages/uk.json";

const nav = vi.hoisted(() => ({ pathname: "/" }));
const { sendGAEvent } = vi.hoisted(() => ({ sendGAEvent: vi.fn() }));

vi.mock("@/lib/analytics", () => ({ sendGAEvent }));

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
  usePathname: () => nav.pathname,
}));

const item = (productId: string, quantity: number) => ({
  productId,
  name: productId,
  price: 950,
  image: "",
  quantity,
});

describe("MobileBottomNav — нижня панель на телефоні", () => {
  beforeEach(() => {
    nav.pathname = "/";
    useCart.setState({ items: [], isOpen: false });
    sendGAEvent.mockClear();
  });

  it("тримає «Запитати», пошук, кошик, каталог і меню під великим пальцем", () => {
    const onSearch = vi.fn();
    const onMenu = vi.fn();
    render(<MobileBottomNav onSearch={onSearch} onMenu={onMenu} />);

    expect(screen.getByRole("link", { name: uk.bottomNav.catalog })).toHaveAttribute("href", "/shop");

    fireEvent.click(screen.getByRole("button", { name: uk.bottomNav.search }));
    expect(onSearch).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: uk.bottomNav.menu }));
    expect(onMenu).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: uk.bottomNav.cart }));
    expect(useCart.getState().isOpen).toBe(true);
  });

  it("показує на кошику, скільки в ньому товарів і на яку суму", () => {
    useCart.setState({ items: [item("a", 2), item("b", 1)] });
    render(<MobileBottomNav onSearch={vi.fn()} onMenu={vi.fn()} />);

    const cart = screen.getByRole("button", { name: "Кошик, товарів: 3, на суму 2 850 грн" });
    expect(cart).toHaveTextContent("3");
    // The sum replaces the word "Кошик" under the icon.
    expect(cart).toHaveTextContent("2 850 грн");
    expect(cart).not.toHaveTextContent(uk.bottomNav.cart);
  });

  it("порожній кошик підписаний словом «Кошик»", () => {
    render(<MobileBottomNav onSearch={vi.fn()} onMenu={vi.fn()} />);

    const cart = screen.getByRole("button", { name: uk.bottomNav.cart });
    expect(cart).toHaveTextContent(uk.bottomNav.cart);
    expect(cart).not.toHaveTextContent("грн");
  });

  it("ставить п'ять пунктів у порядку: запитати, пошук, кошик, каталог, меню", () => {
    render(<MobileBottomNav onSearch={vi.fn()} onMenu={vi.fn()} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(5);
    expect(items.map((li) => li.firstElementChild?.getAttribute("aria-label") ?? li.textContent)).toEqual([
      uk.bottomNav.askAria,
      uk.bottomNav.search,
      uk.bottomNav.cart,
      uk.bottomNav.catalog,
      uk.bottomNav.menu,
    ]);
  });

  it("«Запитати» відкриває Telegram технолога в новій вкладці й рахує консультацію", () => {
    render(<MobileBottomNav onSearch={vi.fn()} onMenu={vi.fn()} />);

    const ask = screen.getByRole("link", { name: uk.bottomNav.askAria });
    expect(ask).toHaveAttribute("href", "https://t.me/violagegedosh");
    expect(ask).toHaveAttribute("target", "_blank");
    expect(ask).toHaveAttribute("rel", "noopener noreferrer");
    expect(ask).toHaveTextContent(uk.bottomNav.ask);

    // jsdom cannot open a new tab; only the analytics event is checked here.
    ask.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(ask);
    expect(sendGAEvent).toHaveBeenCalledWith("event", "telegram_consultation", { source: "bottom_nav" });
  });

  it("позначає каталог активним на сторінках магазину", () => {
    nav.pathname = "/shop/category/shampoos";
    render(<MobileBottomNav onSearch={vi.fn()} onMenu={vi.fn()} />);

    expect(screen.getByRole("link", { name: uk.bottomNav.catalog })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("зникає на оформленні замовлення, щоб не відволікати від форми", () => {
    nav.pathname = "/checkout";
    const { container } = render(<MobileBottomNav onSearch={vi.fn()} onMenu={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("лишається на сторінці подяки після замовлення", () => {
    nav.pathname = "/checkout/success";
    render(<MobileBottomNav onSearch={vi.fn()} onMenu={vi.fn()} />);

    expect(screen.getByRole("navigation", { name: uk.bottomNav.label })).toBeInTheDocument();
  });
});

describe("MobileBottomNav — аналітика", () => {
  beforeEach(() => {
    nav.pathname = "/";
    useCart.setState({ items: [], isOpen: false });
    sendGAEvent.mockClear();
  });

  it("кожен із п'яти пунктів шле mobile_nav_click зі своїм content_id", () => {
    render(<MobileBottomNav onSearch={vi.fn()} onMenu={vi.fn()} />);

    const catalog = screen.getByRole("link", { name: uk.bottomNav.catalog });
    catalog.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(catalog);
    fireEvent.click(screen.getByRole("button", { name: uk.bottomNav.search }));
    fireEvent.click(screen.getByRole("button", { name: uk.bottomNav.cart }));
    const ask = screen.getByRole("link", { name: uk.bottomNav.askAria });
    ask.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(ask);
    fireEvent.click(screen.getByRole("button", { name: uk.bottomNav.menu }));

    const clicks = sendGAEvent.mock.calls
      .filter(([, name]) => name === "mobile_nav_click")
      .map(([, , params]) => params);
    expect(clicks).toEqual(
      ["catalog", "search", "cart", "ask", "menu"].map((id) => ({
        content_type: "bottom_nav",
        content_id: id,
      })),
    );
    // «Запитати» still counts as a consultation, and the cart knows where it was opened from.
    expect(sendGAEvent).toHaveBeenCalledWith("event", "telegram_consultation", { source: "bottom_nav" });
    expect(useCart.getState().openMethod).toBe("bottom_nav");
  });
});
