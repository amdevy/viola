import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRef } from "react";
import { render, screen, fireEvent, waitFor, configure } from "@testing-library/react";
import uk from "@/messages/uk.json";
import type { CategoryNode } from "@/lib/categories";
import type { SearchProduct } from "@/lib/search";

// Every test here re-imports the overlay and waits for its catalogue request.
// On a busy machine that can outlast the default one-second wait.
configure({ asyncUtilTimeout: 5000 });

const { sendGAEvent, push, nav } = vi.hoisted(() => ({
  sendGAEvent: vi.fn(),
  push: vi.fn(),
  nav: { pathname: "/" },
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
  usePathname: () => nav.pathname,
  useRouter: () => ({ push }),
}));

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("@/lib/analytics", () => ({ sendGAEvent }));

const product = (over: Partial<SearchProduct> & Pick<SearchProduct, "id" | "name">): SearchProduct => ({
  slug: over.id,
  name_en: null,
  price: 950,
  image: null,
  volume: "250 мл",
  category: "Шампуні",
  category_en: "Shampoos",
  in_stock: true,
  is_coming_soon: false,
  is_bestseller: false,
  ...over,
});

const PRODUCTS = [
  product({ id: "hyaluron", name: "Шампунь з гіалуроновою кислотою", is_bestseller: true }),
  product({ id: "blueberry", name: "Шампунь з екстрактом чорниці", price: 900 }),
  product({ id: "mask", name: "Маска ламінація для волосся", category: "Маски", in_stock: false }),
];

const CATEGORIES = [
  { id: "c1", slug: "shampoos", name: "Шампуні", children: [] },
  { id: "c2", slug: "masks", name: "Маски", children: [] },
] as unknown as CategoryNode[];

// The overlay keeps the catalogue in a module-level cache for the whole visit,
// so each test loads a fresh copy of the module — and, with it, a fresh cart
// store, which is why the cart is taken from the same import.
async function renderOverlay(onClose = vi.fn()) {
  vi.resetModules();
  const { default: SearchOverlay } = await import("@/components/search/SearchOverlay");
  const { useCart } = await import("@/hooks/useCart");
  const inputRef = createRef<HTMLInputElement>();
  const { unmount } = render(
    <SearchOverlay onClose={onClose} categories={CATEGORIES} inputRef={inputRef} />,
  );
  return { onClose, inputRef, unmount, cart: () => useCart.getState() };
}

const type = (text: string) =>
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: text } });

describe("SearchOverlay — пошук товарів", () => {
  beforeEach(() => {
    nav.pathname = "/";
    push.mockClear();
    sendGAEvent.mockClear();
    // The cart persists to localStorage; a fresh store would read the last test's.
    localStorage.clear();
    // The search remembers its query for the session; each test starts empty.
    sessionStorage.clear();
    window.history.replaceState(null, "");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ products: PRODUCTS }) })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("без запиту пропонує категорії та популярне", async () => {
    await renderOverlay();

    expect(await screen.findByRole("link", { name: "Шампуні" })).toHaveAttribute(
      "href",
      "/shop/category/shampoos",
    );
    expect(screen.getByText(uk.search.popular)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /гіалуроновою/ })).toHaveAttribute("href", "/shop/hyaluron");
    // Один запит на весь каталог, а не по запиту на літеру.
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith("/api/products/search-index");
  });

  it("шукає під час набору й показує лише збіги", async () => {
    await renderOverlay();
    await screen.findByText(uk.search.popular);

    type("чорн");

    expect(screen.getByRole("link", { name: /чорниці/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /гіалуроновою/ })).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("«+» кладе товар у кошик, не закриваючи пошук; друге натискання відкриває кошик", async () => {
    const { onClose, cart } = await renderOverlay();
    await screen.findByText(uk.search.popular);
    type("чорн");

    fireEvent.click(
      screen.getByRole("button", { name: `${uk.productCard.addToCartFull}: Шампунь з екстрактом чорниці` }),
    );

    expect(cart().items).toEqual([
      expect.objectContaining({ productId: "blueberry", quantity: 1, price: 900 }),
    ]);
    expect(cart().isOpen).toBe(false);
    expect(onClose).not.toHaveBeenCalled();
    expect(sendGAEvent).toHaveBeenCalledWith(
      "event",
      "add_to_cart",
      expect.objectContaining({ item_list_name: "search", value: 900 }),
    );

    fireEvent.click(screen.getByRole("button", { name: uk.productCard.inCartOpen }));

    expect(cart().items[0].quantity).toBe(1);
    expect(cart().isOpen).toBe(true);
    expect(onClose).toHaveBeenCalled();
  });

  it("товар у кошику каже про це словами, а не лише галочкою", async () => {
    await renderOverlay();
    await screen.findByText(uk.search.popular);
    type("чорн");

    const row = screen.getByRole("link", { name: /чорниці/ });
    expect(row).not.toHaveTextContent(uk.productCard.inCart);

    fireEvent.click(
      screen.getByRole("button", { name: `${uk.productCard.addToCartFull}: Шампунь з екстрактом чорниці` }),
    );

    expect(screen.getByRole("link", { name: /чорниці/ })).toHaveTextContent(uk.productCard.inCart);
  });

  it("стрілка «назад» зліва від поля закриває пошук", async () => {
    const { onClose } = await renderOverlay();
    await screen.findByText(uk.search.popular);

    // The back arrow (phones) comes before the field; "Закрити" (md+) after it.
    const [back] = screen.getAllByRole("button", { name: uk.search.close });
    expect(
      back.compareDocumentPosition(screen.getByRole("searchbox")) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    fireEvent.click(back);

    expect(onClose).toHaveBeenCalled();
  });

  it("поки пошук відкритий, <html> позначений, щоб сторінка під ним сховалась", async () => {
    const { unmount } = await renderOverlay();

    expect(document.documentElement).toHaveAttribute("data-search-open");
    expect(screen.getByRole("dialog")).toHaveAttribute("data-search-overlay");

    unmount();
    expect(document.documentElement).not.toHaveAttribute("data-search-open");
  });

  it("товар, якого немає в наявності, показує, але не продає", async () => {
    await renderOverlay();
    await screen.findByText(uk.search.popular);
    type("ламінація");

    expect(screen.getByRole("link", { name: /ламінація/ })).toHaveTextContent(uk.productCard.outOfStock);
    expect(screen.queryByRole("button", { name: /Додати до кошика/ })).toBeNull();
  });

  it("нічого не знайшов — каже про це й пропонує технолога та каталог", async () => {
    await renderOverlay();
    await screen.findByText(uk.search.popular);
    type("парфуми");

    expect(screen.getByText("За запитом «парфуми» нічого не знайдено")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: uk.search.askTelegram })).toHaveAttribute(
      "href",
      "https://t.me/violagegedosh",
    );
    expect(screen.getByRole("link", { name: uk.search.allProducts })).toHaveAttribute("href", "/shop");
  });

  it("Enter веде в каталог із цим запитом", async () => {
    const { onClose } = await renderOverlay();
    await screen.findByText(uk.search.popular);
    type("шампунь");

    fireEvent.submit(screen.getByRole("search"));

    expect(push).toHaveBeenCalledWith({ pathname: "/shop", query: { search: "шампунь" } });
    expect(onClose).toHaveBeenCalled();
  });

  it("клік по товару закриває пошук і шле select_item", async () => {
    const { onClose } = await renderOverlay();
    await screen.findByText(uk.search.popular);
    type("чорн");

    const link = screen.getByRole("link", { name: /чорниці/ });
    link.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(link);

    expect(onClose).toHaveBeenCalled();
    expect(sendGAEvent).toHaveBeenCalledWith(
      "event",
      "select_item",
      expect.objectContaining({ item_list_name: "search" }),
    );
  });

  it("каталог не завантажився — пропонує спробувати ще раз, і це працює", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 503 })
        .mockResolvedValue({ ok: true, json: async () => ({ products: PRODUCTS }) }),
    );
    await renderOverlay();

    fireEvent.click(await screen.findByRole("button", { name: uk.search.retry }));

    await waitFor(() => expect(screen.getByText(uk.search.popular)).toBeInTheDocument());
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("Escape закриває пошук", async () => {
    const { onClose } = await renderOverlay();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalled();
  });
});

describe("SearchOverlay — повернення до пошуку", () => {
  const marker = () => (window.history.state as Record<string, unknown> | null)?.violaSearch;

  beforeEach(() => {
    nav.pathname = "/";
    push.mockClear();
    sendGAEvent.mockClear();
    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState(null, "");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ products: PRODUCTS }) })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("кнопки під «нічого не знайдено» мають підписи по центру", async () => {
    await renderOverlay();
    await screen.findByText(uk.search.popular);
    type("парфуми");

    for (const name of [uk.search.askTelegram, uk.search.allProducts]) {
      expect(screen.getByRole("link", { name })).toHaveClass("items-center", "justify-center", "text-center");
    }
  });

  it("запит лишається після закриття: наступне відкриття показує його з результатами", async () => {
    const first = await renderOverlay();
    await screen.findByText(uk.search.popular);
    type("чорн");
    first.unmount();

    await renderOverlay();
    expect(screen.getByRole("searchbox")).toHaveValue("чорн");
    expect(await screen.findByRole("link", { name: /чорниці/ })).toBeInTheDocument();
  });

  it("«×» очищає і поле, і збережений запит", async () => {
    await renderOverlay();
    await screen.findByText(uk.search.popular);
    type("чорн");
    expect(sessionStorage.length).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: uk.search.clear }));

    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(sessionStorage.length).toBe(0);
  });

  it("перехід на товар позначає запис історії й зберігає запит", async () => {
    const { onClose } = await renderOverlay();
    await screen.findByText(uk.search.popular);
    type("чорн");

    const link = screen.getByRole("link", { name: /чорниці/ });
    link.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(link);

    expect(marker()).toEqual({ scrollTop: 0 });
    expect(onClose).toHaveBeenCalled();
    // A fresh mount (as after Back) starts from the same query.
    const { readStoredQuery } = await import("@/lib/search-session");
    expect(readStoredQuery()).toBe("чорн");
  });

  it("«Показати всі» / Enter теж позначає запис, щоб Back повернув до пошуку", async () => {
    await renderOverlay();
    await screen.findByText(uk.search.popular);
    type("шампунь");

    fireEvent.submit(screen.getByRole("search"));

    expect(marker()).toBeTruthy();
    expect(push).toHaveBeenCalledWith({ pathname: "/shop", query: { search: "шампунь" } });
  });

  it("товар, на сторінці якого вже стоїш, просто закриває пошук, без позначки", async () => {
    nav.pathname = "/shop/blueberry";
    const { onClose } = await renderOverlay();
    await screen.findByText(uk.search.popular);
    type("чорн");

    const link = screen.getByRole("link", { name: /чорниці/ });
    link.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(link);

    expect(marker()).toBeUndefined();
    expect(onClose).toHaveBeenCalled();
  });

  it("закриття самим покупцем знімає позначку, тож Back не відкриє пошук знову", async () => {
    window.history.replaceState({ __NA: true, violaSearch: { scrollTop: 0 } }, "");
    const { onClose } = await renderOverlay();

    const [back] = screen.getAllByRole("button", { name: uk.search.close });
    fireEvent.click(back);

    expect(onClose).toHaveBeenCalled();
    expect(marker()).toBeUndefined();
    // Next's own entry data stays.
    expect(window.history.state).toEqual({ __NA: true });
  });

  it("Escape теж знімає позначку", async () => {
    window.history.replaceState({ violaSearch: { scrollTop: 0 } }, "");
    await renderOverlay();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(marker()).toBeUndefined();
  });
});

describe("SearchOverlay — аналітика", () => {
  const events = (name: string) =>
    sendGAEvent.mock.calls.filter(([, event]) => event === name).map(([, , params]) => params);
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  beforeEach(() => {
    nav.pathname = "/";
    push.mockClear();
    sendGAEvent.mockClear();
    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState(null, "");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ products: PRODUCTS }) })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("один «search» на запит: Enter шле одразу, пауза в наборі вже не дублює", async () => {
    await renderOverlay();
    await screen.findByText(uk.search.popular);
    type("чорн");

    fireEvent.submit(screen.getByRole("search"));
    expect(events("search")).toEqual([{ search_term: "чорн", results_count: 1 }]);

    await wait(1300);
    expect(events("search")).toHaveLength(1);
    expect(events("search_no_results")).toHaveLength(0);
  });

  it("нічого не знайдено — ще й «search_no_results»", async () => {
    await renderOverlay();
    await screen.findByText(uk.search.popular);
    type("парфуми");

    fireEvent.submit(screen.getByRole("search"));

    expect(events("search")).toEqual([{ search_term: "парфуми", results_count: 0 }]);
    expect(events("search_no_results")).toEqual([{ search_term: "парфуми" }]);
  });

  it("запит, збережений з минулого разу, не рахується як новий пошук", async () => {
    sessionStorage.setItem("viola:search-query", "чорн");
    await renderOverlay();
    await screen.findByRole("link", { name: /чорниці/ });

    await wait(1300);
    expect(events("search")).toHaveLength(0);
  });

  it("select_item з пошуку: список, запит і позиція (з нуля)", async () => {
    await renderOverlay();
    await screen.findByText(uk.search.popular);
    type("шампунь");

    const link = screen.getByRole("link", { name: /чорниці/ });
    link.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(link);

    expect(events("select_item")).toEqual([
      {
        item_list_id: "search",
        item_list_name: "search",
        search_term: "шампунь",
        items: [{ item_id: "blueberry", item_name: "Шампунь з екстрактом чорниці", price: 900, index: 1 }],
      },
    ]);
  });

  it("select_item і add_to_cart з «Популярного» — список search_popular, без запиту", async () => {
    await renderOverlay();
    await screen.findByText(uk.search.popular);

    fireEvent.click(
      screen.getByRole("button", { name: `${uk.productCard.addToCartFull}: Шампунь з гіалуроновою кислотою` }),
    );
    expect(events("add_to_cart")[0]).toEqual(
      expect.objectContaining({ item_list_id: "search_popular", item_list_name: "search" }),
    );

    const link = screen.getByRole("link", { name: /гіалуроновою/ });
    link.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(link);

    expect(events("select_item")).toEqual([
      {
        item_list_id: "search_popular",
        item_list_name: "search_popular",
        items: [{ item_id: "hyaluron", item_name: "Шампунь з гіалуроновою кислотою", price: 950, index: 0 }],
      },
    ]);
  });

  it("кнопки під «нічого не знайдено» шлють свої події з запитом", async () => {
    const { onClose } = await renderOverlay();
    await screen.findByText(uk.search.popular);
    type("парфуми");

    const telegram = screen.getByRole("link", { name: uk.search.askTelegram });
    telegram.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(telegram);
    expect(events("telegram_consultation")).toEqual([
      { method: "search_no_results", search_term: "парфуми" },
    ]);

    const all = screen.getByRole("link", { name: uk.search.allProducts });
    all.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(all);
    expect(events("select_content")).toEqual([
      { content_type: "search_no_results", content_id: "all_products", search_term: "парфуми" },
    ]);
    expect(onClose).toHaveBeenCalled();
  });

  it("«×» шле search_clear зі стертим запитом і не дає вдруге порахувати той самий пошук", async () => {
    await renderOverlay();
    await screen.findByText(uk.search.popular);
    type("  Чорн ");
    fireEvent.submit(screen.getByRole("search"));

    fireEvent.click(screen.getByRole("button", { name: uk.search.clear }));
    expect(events("search_clear")).toEqual([{ search_term: "чорн" }]);

    type("чорн");
    fireEvent.submit(screen.getByRole("search"));
    expect(events("search")).toHaveLength(1);
  });

  it("«×» без запиту нічого не шле", async () => {
    await renderOverlay();
    await screen.findByText(uk.search.popular);
    // Spaces only: the clear button shows, but there is no term to report.
    type("   ");

    fireEvent.click(screen.getByRole("button", { name: uk.search.clear }));
    expect(events("search_clear")).toHaveLength(0);
  });
});
