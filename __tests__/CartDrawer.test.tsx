import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within, act } from "@testing-library/react";
import CartDrawer from "@/components/shop/CartDrawer";
import { useCart } from "@/hooks/useCart";
import uk from "@/messages/uk.json";

const { sendGAEvent } = vi.hoisted(() => ({ sendGAEvent: vi.fn() }));

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

vi.mock("@/lib/analytics", () => ({ sendGAEvent }));
vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));

const item = (productId: string, name: string, quantity = 1) => ({
  productId,
  name,
  price: 900,
  image: "",
  quantity,
});

const RECOMMENDED = {
  id: "r1",
  name: "Термозахисний спрей",
  name_en: null,
  slug: "termozakhyst",
  price: 780,
  images: null,
  volume: "200 мл",
};

describe("CartDrawer — кошик збоку", () => {
  beforeEach(() => {
    sendGAEvent.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ products: [RECOMMENDED] }) })),
    );
    useCart.setState({
      items: [
        item("a", "Колагеновий шампунь", 2),
        item("b", "Маска Diamond Gloss"),
        item("c", "Тонік мультивітамінний"),
        item("d", "Пілінг для шкіри голови"),
      ],
      isOpen: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    useCart.setState({ items: [], isOpen: false });
  });

  it("товари кошика й «Доповніть догляд» гортаються разом, товари — першими", async () => {
    // Раніше рекомендації стояли поза прокруткою: чотири рядки допродажу були
    // видні завжди, а від власних товарів кошика — півтора.
    render(<CartDrawer />);

    const recsTitle = await screen.findByText(uk.cartRecommendations.title);
    const firstItem = screen.getByText("Колагеновий шампунь");
    const scroller = firstItem.closest("[data-cart-scroll]");

    expect(scroller).not.toBeNull();
    expect(scroller).toContainElement(recsTitle);
    expect(within(scroller as HTMLElement).getByText(RECOMMENDED.name)).toBeInTheDocument();
    expect(
      firstItem.compareDocumentPosition(recsTitle) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // Підсумок і «Оформити замовлення» — поза прокруткою, завжди під рукою.
    expect(scroller).not.toContainElement(screen.getByRole("link", { name: uk.cart.placeOrder }));
  });

  it("кнопки кількості й видалення мають назви і працюють", async () => {
    render(<CartDrawer />);
    await screen.findByText(uk.cartRecommendations.title);

    expect(screen.getByRole("button", { name: uk.cart.close })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: uk.cart.increase })[0]);
    expect(useCart.getState().items[0].quantity).toBe(3);

    fireEvent.click(screen.getAllByRole("button", { name: uk.cart.decrease })[0]);
    expect(useCart.getState().items[0].quantity).toBe(2);

    fireEvent.click(screen.getAllByRole("button", { name: uk.cart.remove })[0]);
    expect(useCart.getState().items.map((i) => i.productId)).toEqual(["b", "c", "d"]);
    expect(sendGAEvent).toHaveBeenCalledWith("event", "remove_from_cart", expect.anything());
  });

  it("над «Оформити замовлення» — обов’язкова за правилами бренду порада звернутися до майстра", async () => {
    render(<CartDrawer />);
    await screen.findByText(uk.cartRecommendations.title);

    const note = screen.getByText(
      "Перед покупкою рекомендуємо отримати рекомендацію кваліфікованого майстра.",
    );
    const placeOrder = screen.getByRole("link", { name: uk.cart.placeOrder });
    // Поруч із кнопкою, у футері, а не загублена в прокрутці.
    expect(note.closest("[data-cart-scroll]")).toBeNull();
    expect(
      note.compareDocumentPosition(placeOrder) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

describe("CartDrawer — тінь", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    useCart.setState({ items: [], isOpen: false });
  });

  it("закритий кошик не кидає тінь на сторінку, відкритий — кидає", () => {
    // Закритий кошик стоїть за правим краєм екрана; його тінь лягала на
    // сторінку сірою смугою вздовж усього правого краю.
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ products: [] }) })));
    useCart.setState({ items: [], isOpen: false });
    const { container } = render(<CartDrawer />);
    const drawer = container.querySelector("[data-cart-drawer]");

    expect(drawer).not.toHaveClass("shadow-2xl");

    act(() => useCart.setState({ isOpen: true }));
    expect(drawer).toHaveClass("shadow-2xl");
  });
});

describe("CartDrawer — view_cart", () => {
  const views = () =>
    sendGAEvent.mock.calls.filter(([, name]) => name === "view_cart").map(([, , params]) => params);

  beforeEach(() => {
    sendGAEvent.mockClear();
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ products: [] }) })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    useCart.setState({ items: [], isOpen: false, openMethod: null });
  });

  it("один view_cart на відкриття, з тим, звідки відкрили; зміна кількості його не повторює", async () => {
    useCart.setState({ items: [item("a", "Колагеновий шампунь")], isOpen: false, openMethod: null });
    render(<CartDrawer />);
    expect(views()).toHaveLength(0);

    act(() => useCart.getState().openCart("toast"));
    expect(views()).toEqual([
      expect.objectContaining({ method: "toast", value: 900, currency: "UAH" }),
    ]);

    fireEvent.click(screen.getByRole("button", { name: uk.cart.increase }));
    expect(useCart.getState().items[0].quantity).toBe(2);
    expect(views()).toHaveLength(1);

    act(() => useCart.getState().closeCart());
    act(() => useCart.getState().openCart("header"));
    expect(views()).toHaveLength(2);
    expect(views()[1]).toEqual(expect.objectContaining({ method: "header", value: 1800 }));
  });

  it("порожній кошик — без view_cart", () => {
    useCart.setState({ items: [], isOpen: false, openMethod: null });
    render(<CartDrawer />);

    act(() => useCart.getState().openCart("bottom_nav"));
    expect(views()).toHaveLength(0);
  });
});
