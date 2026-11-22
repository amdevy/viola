import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, configure } from "@testing-library/react";
import Header from "@/components/layout/Header";
import uk from "@/messages/uk.json";
import type { SearchProduct } from "@/lib/search";

configure({ asyncUtilTimeout: 5000 });

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
  usePathname: () => "/shop/blueberry",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("@/lib/analytics", () => ({ sendGAEvent }));
vi.mock("@/components/layout/LanguageSwitcher", () => ({ default: () => null }));
vi.mock("@/components/shop/CartDrawer", () => ({ default: () => null }));
// The bottom bar's search tab, reduced to the one call that matters here.
vi.mock("@/components/layout/MobileBottomNav", () => ({
  default: ({ onSearch }: { onSearch: () => void }) => (
    <button type="button" onClick={onSearch}>
      open-search
    </button>
  ),
}));

const PRODUCTS: SearchProduct[] = [
  {
    id: "blueberry",
    slug: "blueberry",
    name: "Шампунь з екстрактом чорниці",
    name_en: null,
    price: 900,
    image: null,
    volume: "250 мл",
    category: "Шампуні",
    category_en: "Shampoos",
    in_stock: true,
    is_coming_soon: false,
    is_bestseller: false,
  },
];

const popstate = () => act(() => window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state })));
const events = (name: string) => sendGAEvent.mock.calls.filter(([, event]) => event === name);

describe("Header — Back повертає до пошуку", () => {
  beforeEach(() => {
    sendGAEvent.mockClear();
    sessionStorage.clear();
    localStorage.clear();
    window.history.replaceState(null, "");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ products: PRODUCTS }) })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("запис із позначкою відкриває пошук з тим самим запитом, без фокуса і без повторного «search»", async () => {
    sessionStorage.setItem("viola:search-query", "чорн");
    render(<Header categories={[]} />);
    expect(screen.queryByRole("dialog")).toBeNull();

    // Back lands on the entry the shopper left the search from.
    window.history.replaceState({ __NA: true, violaSearch: { scrollTop: 0 } }, "");
    popstate();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toHaveValue("чорн");
    expect(screen.getByRole("searchbox")).not.toHaveFocus();
    expect(await screen.findByRole("link", { name: /чорниці/ })).toBeInTheDocument();
    expect(events("search_return").map(([, , params]) => params)).toEqual([{ search_term: "чорн" }]);

    await act(() => new Promise((resolve) => setTimeout(resolve, 1300)));
    expect(events("search")).toHaveLength(0);
  });

  it("запис без позначки закриває пошук", async () => {
    render(<Header categories={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "open-search" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    // Opened by a tap: the field gets the focus (the keyboard comes up).
    expect(screen.getByRole("searchbox")).toHaveFocus();

    window.history.replaceState({ __NA: true }, "");
    popstate();

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(events("search_return")).toHaveLength(0);
  });
});
