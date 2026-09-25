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

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) =>
    ((uk as Record<string, Record<string, string>>)[ns] ?? {})[key] ?? `${ns}.${key}`,
  useLocale: () => "uk",
}));

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

vi.mock("@next/third-parties/google", () => ({ sendGAEvent }));
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
    // Повний каталог, що встиг показатися до гідратації, як переглянутий не рахуємо.
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

    expect(viewedLists()).toEqual([
      ["p1", "p2", "p3"],
      ["p3", "p1", "p2"],
      ["p1", "p2", "p3"],
      ["p3", "p1", "p2"],
    ]);
  });

  it("без initialProducts (сервер не віддав список) вантажить каталог на клієнті, як раніше", async () => {
    const { productsUrl } = stubSupabase({ products: CATALOGUE });

    render(<ShopContent initialProducts={null} />);

    expect(skeleton()).not.toBeNull();
    await waitFor(() => expect(productHrefs()).toEqual(hrefsOf(CATALOGUE)));
    expect(productsUrl()).toContain("order=is_bestseller.desc,created_at.desc");
  });
});
