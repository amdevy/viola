import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import ShopContent from "@/app/(public)/[locale]/shop/ShopContent";
import { createClient } from "@/lib/supabase/client";
import uk from "@/messages/uk.json";
import type { Product } from "@/types";

const { sendGAEvent, nav } = vi.hoisted(() => ({
  sendGAEvent: vi.fn(),
  nav: { searchParams: new URLSearchParams() },
}));

// Real next-intl formatting over the uk messages, so ICU plurals ("1 товар",
// "Показати 2 товари") render as they do on the site.
vi.mock("next-intl", async (importOriginal) => {
  const { createTranslator } = await importOriginal<typeof import("next-intl")>();
  return {
    useTranslations: (namespace: string) =>
      createTranslator({ locale: "uk", messages: uk, namespace: namespace as never }),
    useLocale: () => "uk",
  };
});

vi.mock("next/navigation", () => ({ useSearchParams: () => nav.searchParams }));

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
vi.mock("@/hooks/useCart", () => ({ useCart: () => ({ addItem: vi.fn(), openCart: vi.fn() }) }));
vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/shop/StockNotifyModal", () => ({ default: () => null }));
vi.mock("@/components/shop/ProductLikeButton", () => ({ default: () => null }));

// Дерево категорій для бокового фільтра — окремий запит, до списку товарів він
// не стосується. Сам useProducts лишається справжнім.
vi.mock("@/hooks/useProducts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/useProducts")>()),
  useCategories: () => ({ categories: [], tree: [], loading: false }),
}));

// Справжній supabase-js, лише без cookies і env: кожен запит іде через
// глобальний fetch, тож заглушка fetch бачить усе, що компонент вантажить.
vi.mock("@/lib/supabase/client", async () => {
  const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
  return {
    createClient: vi.fn(() =>
      createSupabaseClient("https://test.supabase.co", "test-anon-key", {
        auth: { persistSession: false, autoRefreshToken: false },
      }),
    ),
  };
});

const product = (id: string, slug: string, name: string, price: number): Product => ({
  id,
  slug,
  name,
  description: null,
  ingredients: null,
  how_to_use: null,
  price,
  compare_price: null,
  images: [`/${slug}.jpg`],
  category_id: "c1",
  in_stock: true,
  is_new: false,
  is_coming_soon: false,
  is_bestseller: false,
  benefits: [],
  likes_count: 0,
  volume: null,
  hair_type: [],
  created_at: "2026-01-01T00:00:00Z",
});

const SHAMPOO = product("p1", "kolahenovyy-shampun", "Колагеновий шампунь", 650);
const MASK = product("p2", "maska-diamond-gloss", "Маска Diamond Gloss", 900);
const TONIC = product("p3", "tonik-multyvitaminnyy", "Тонік мультивітамінний", 480);
const CATALOGUE = [SHAMPOO, MASK, TONIC];
// The same catalogue with one product tagged, so the hair-type filter appears.
const DRY_MASK: Product = { ...MASK, hair_type: ["dry"] };
const TAGGED = [SHAMPOO, DRY_MASK, TONIC];

const productHrefs = () =>
  Array.from(document.querySelectorAll('a[href^="/shop/"]')).map((a) => a.getAttribute("href"));
const hrefsOf = (products: Product[]) => products.map((p) => `/shop/${p.slug}`);
const skeleton = () => document.querySelector(".animate-pulse");

/** item_id-и з кожного view_item_list, по порядку. */
const viewedLists = () =>
  sendGAEvent.mock.calls
    .filter(([, name]) => name === "view_item_list")
    .map(([, , params]) => (params as { items: { item_id: string }[] }).items.map((i) => i.item_id));

/** Заглушка PostgREST: відповідь за назвою таблиці з URL запиту. */
const stubSupabase = (tables: Record<string, unknown>) => {
  const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
    const table = new URL(String(input)).pathname.split("/").pop()!;
    return new Response(JSON.stringify(tables[table]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", fetchSpy);
  return {
    fetchSpy,
    productsUrl: () =>
      decodeURIComponent(
        String(fetchSpy.mock.calls.map(([url]) => String(url)).find((u) => u.includes("/rest/v1/products"))),
      ),
  };
};

/** Дати відпрацювати всьому, що ефекти могли запустити асинхронно. */
const flush = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

describe("ShopContent — каталог у розмітці", () => {
  beforeEach(() => {
    nav.searchParams = new URLSearchParams();
    sendGAEvent.mockClear();
    vi.mocked(createClient).mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("малює посилання на всі товари з initialProducts, без клієнтського запиту", async () => {
    // Раніше /shop тягнув товари ефектом, і в серверному HTML не було жодного
    // посилання на товар. Fetch тут не змоканий відповіддю: якщо компонент
    // спробує вантажити список сам, тест впаде.
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    render(<ShopContent initialProducts={CATALOGUE} />);
    await flush();

    expect(productHrefs()).toEqual(hrefsOf(CATALOGUE));
    expect(skeleton()).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    // view_item_list — рівно один, на початковий список, як і до змін.
    expect(viewedLists()).toEqual([["p1", "p2", "p3"]]);
  });

  it("?category= у посиланні: вантажить категорію на клієнті, view_item_list — лише для неї", async () => {
    nav.searchParams = new URLSearchParams("category=masks");
    const { productsUrl } = stubSupabase({ categories: { id: "c-masks" }, products: [MASK] });

    render(<ShopContent initialProducts={CATALOGUE} />);

    expect(skeleton()).not.toBeNull();
    await waitFor(() => expect(productHrefs()).toEqual(hrefsOf([MASK])));
    expect(productsUrl()).toContain("category_id=eq.c-masks");
    // view_item_list іде з ефекту після коміту, а не разом із DOM: при
    // паралельному прогоні він доходить уже після посилань, тож його чекаємо.
    // Повний каталог, що встиг показатися до гідратації, як переглянутий не рахуємо —
    // з ним у списку рівність не настане ніколи.
    await waitFor(() => expect(viewedLists()).toEqual([["p2"]]));
    await flush();
    expect(viewedLists()).toEqual([["p2"]]);
  });

  it("зміна сортування перезапитує список, а повернення до «Популярних» бере початковий без запиту", async () => {
    const { fetchSpy, productsUrl } = stubSupabase({ products: [TONIC, SHAMPOO, MASK] });

    render(<ShopContent initialProducts={CATALOGUE} />);
    const sort = screen.getByRole("combobox");

    fireEvent.change(sort, { target: { value: "price_asc" } });
    expect(skeleton()).not.toBeNull();
    await waitFor(() => expect(productHrefs()).toEqual(hrefsOf([TONIC, SHAMPOO, MASK])));
    expect(productsUrl()).toContain("order=price.asc");

    fetchSpy.mockClear();
    fireEvent.change(sort, { target: { value: "popular" } });
    expect(productHrefs()).toEqual(hrefsOf(CATALOGUE));
    expect(skeleton()).toBeNull();
    await flush();
    expect(fetchSpy).not.toHaveBeenCalled();

    // Те саме сортування вдруге — знову скелетон і свіжий запит, а не
    // збережений з минулого разу список.
    fireEvent.change(sort, { target: { value: "price_asc" } });
    expect(skeleton()).not.toBeNull();
    await waitFor(() => expect(productHrefs()).toEqual(hrefsOf([TONIC, SHAMPOO, MASK])));
    expect(fetchSpy).toHaveBeenCalled();

    // Остання подія приходить з ефекту вже після посилань — див. тест вище.
    const expectedViews = [
      ["p1", "p2", "p3"],
      ["p3", "p1", "p2"],
      ["p1", "p2", "p3"],
      ["p3", "p1", "p2"],
    ];
    await waitFor(() => expect(viewedLists()).toEqual(expectedViews));
    await flush();
    expect(viewedLists()).toEqual(expectedViews);
  });

  it("без initialProducts (сервер не віддав список) вантажить каталог на клієнті, як раніше", async () => {
    const { productsUrl } = stubSupabase({ products: CATALOGUE });

    render(<ShopContent initialProducts={null} />);

    expect(skeleton()).not.toBeNull();
    await waitFor(() => expect(productHrefs()).toEqual(hrefsOf(CATALOGUE)));
    expect(productsUrl()).toContain("order=is_bestseller.desc,created_at.desc");
  });
});

describe("ShopContent — фільтри на телефоні", () => {
  const filtersToggle = () => screen.getByRole("button", { name: /^Фільтри/ });
  const resultsButton = () => screen.queryByRole("button", { name: /^Показати|^Товарів не знайдено/ });
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    nav.searchParams = new URLSearchParams();
    sendGAEvent.mockClear();
    scrollIntoView.mockClear();
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("кнопка «Фільтри» відкриває панель і смугу з кількістю товарів", async () => {
    vi.stubGlobal("fetch", vi.fn());
    render(<ShopContent initialProducts={TAGGED} />);
    await flush();

    const toggle = filtersToggle();
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById(toggle.getAttribute("aria-controls")!)).not.toBeNull();
    expect(resultsButton()).toBeNull();
    // Правильна множина і в лічильнику над сіткою.
    expect(screen.getByText("3 товари")).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(resultsButton()).toHaveTextContent("Показати 3 товари");
  });

  it("вибір фільтра у відкритій панелі оновлює число на смузі", async () => {
    stubSupabase({ products: [DRY_MASK] });
    render(<ShopContent initialProducts={TAGGED} />);
    fireEvent.click(filtersToggle());

    fireEvent.click(screen.getByRole("radio", { name: uk.hairTypes.dry }));
    // Поки список вантажиться — нейтральний підпис, а не старе число.
    expect(resultsButton()).toHaveTextContent(uk.filter.showProducts);
    await waitFor(() => expect(resultsButton()).toHaveTextContent("Показати 1 товар"));
  });

  it("смуга закриває панель і повертає до списку", async () => {
    vi.stubGlobal("fetch", vi.fn());
    render(<ShopContent initialProducts={TAGGED} />);
    fireEvent.click(filtersToggle());

    fireEvent.click(resultsButton()!);

    expect(filtersToggle()).toHaveAttribute("aria-expanded", "false");
    expect(resultsButton()).toBeNull();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("закрита панель з активними фільтрами показує, скільки їх", async () => {
    stubSupabase({ products: [DRY_MASK] });
    render(<ShopContent initialProducts={TAGGED} />);
    fireEvent.click(filtersToggle());
    fireEvent.click(screen.getByRole("radio", { name: uk.hairTypes.dry }));
    // Сортування — не фільтр, його в лічильник не рахуємо.
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "price_asc" } });
    await waitFor(() => expect(resultsButton()).toHaveTextContent("Показати 1 товар"));

    fireEvent.click(resultsButton()!);

    const toggle = screen.getByRole("button", { name: "Фільтри, активних: 1" });
    expect(toggle).toHaveTextContent("1");
  });
});

describe("ShopContent — фільтр за типом волосся", () => {
  beforeEach(() => {
    nav.searchParams = new URLSearchParams();
    sendGAEvent.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("жоден товар не має типу волосся — блоку немає зовсім", async () => {
    vi.stubGlobal("fetch", vi.fn());
    render(<ShopContent initialProducts={CATALOGUE} />);
    await flush();

    expect(screen.queryByText(uk.filter.hairType)).toBeNull();
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
  });

  it("пропонує лише ті типи, які є в товарів", async () => {
    vi.stubGlobal("fetch", vi.fn());
    render(<ShopContent initialProducts={TAGGED} />);
    await flush();

    expect(screen.getByText(uk.filter.hairType)).toBeInTheDocument();
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(1);
    expect(screen.getByRole("radio", { name: uk.hairTypes.dry })).toBeInTheDocument();
  });

  it("без серверного списку бере типи з першого нефільтрованого списку з клієнта", async () => {
    stubSupabase({ products: TAGGED });
    render(<ShopContent initialProducts={null} />);

    expect(screen.queryByText(uk.filter.hairType)).toBeNull();
    await waitFor(() => expect(screen.getByRole("radio", { name: uk.hairTypes.dry })).toBeInTheDocument());
  });
});

describe("ShopContent — аналітика фільтрів на телефоні", () => {
  const filtersToggle = () => screen.getByRole("button", { name: /^Фільтри/ });
  const events = (name: string) =>
    sendGAEvent.mock.calls.filter(([, event]) => event === name).map(([, , params]) => params);

  beforeEach(() => {
    nav.searchParams = new URLSearchParams();
    sendGAEvent.mockClear();
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("filter_panel_open — лише при відкритті панелі", async () => {
    vi.stubGlobal("fetch", vi.fn());
    render(<ShopContent initialProducts={TAGGED} />);

    fireEvent.click(filtersToggle());
    expect(events("filter_panel_open")).toEqual([{}]);

    fireEvent.click(filtersToggle());
    expect(events("filter_panel_open")).toHaveLength(1);
  });

  it("filter_show_results несе число з кнопки; поки список вантажиться — без числа", async () => {
    stubSupabase({ products: [DRY_MASK] });
    render(<ShopContent initialProducts={TAGGED} />);

    fireEvent.click(filtersToggle());
    fireEvent.click(screen.getByRole("button", { name: "Показати 3 товари" }));
    expect(events("filter_show_results")).toEqual([{ results_count: 3 }]);

    fireEvent.click(filtersToggle());
    fireEvent.click(screen.getByRole("radio", { name: uk.hairTypes.dry }));
    fireEvent.click(screen.getByRole("button", { name: uk.filter.showProducts }));
    expect(events("filter_show_results")).toEqual([{ results_count: 3 }, {}]);
  });
});
