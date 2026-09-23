import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Header from "@/components/layout/Header";
import type { CategoryNode } from "@/lib/categories";
import uk from "@/messages/uk.json";

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) =>
    ((uk as Record<string, Record<string, string>>)[ns] ?? {})[key] ?? `${ns}.${key}`,
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("@/components/layout/LanguageSwitcher", () => ({ default: () => null }));
vi.mock("@/components/shop/CartDrawer", () => ({ default: () => null }));

const node = (
  id: string,
  slug: string,
  name: string,
  children: CategoryNode[] = [],
): CategoryNode =>
  ({
    id,
    slug,
    name,
    parent_id: null,
    sort_order: 1,
    created_at: "2026-01-01T00:00:00Z",
    productCount: children.length ? 0 : 5,
    children,
  }) as CategoryNode;

const TREE: CategoryNode[] = [
  node("1", "shampoos", "Шампуні"),
  node("2", "skin-care", "Догляд за шкірою", [
    node("3", "shower-gels", "Гелі для душу"),
    node("4", "body-scrubs", "Скраби для тіла"),
  ]),
];

const categoryHrefs = () =>
  Array.from(document.querySelectorAll('a[href^="/shop/category/"]')).map((a) =>
    a.getAttribute("href"),
  );

describe("Header — категорії в розмітці", () => {
  it("малює посилання одразу з пропсів, без клієнтського запиту", () => {
    // Раніше категорії тяглися ефектом, тож у серверному HTML цих посилань не
    // було зовсім. Fetch тут навмисно не змокано: якщо компонент спробує його
    // викликати, тест впаде — а значить, посилання знову залежать від JS.
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    render(<Header categories={TREE} />);

    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("веде на сторінки категорій, а не на відфільтрований каталог", () => {
    render(<Header categories={TREE} />);

    const hrefs = categoryHrefs();
    expect(hrefs.length).toBeGreaterThan(0);
    // /shop?category=… — це каталог з фільтром, без H1, текстів і FAQ.
    expect(document.querySelector('a[href*="/shop?category="]')).toBeNull();
  });

  it("показує і батьків, і підкатегорії", () => {
    render(<Header categories={TREE} />);

    const hrefs = new Set(categoryHrefs());
    expect(hrefs).toContain("/shop/category/shampoos");
    expect(hrefs).toContain("/shop/category/skin-care");
    expect(hrefs).toContain("/shop/category/shower-gels");
    expect(hrefs).toContain("/shop/category/body-scrubs");
  });

  it("порожній список не ламає шапку", () => {
    render(<Header categories={[]} />);
    expect(screen.getByAltText(uk.header.logoAlt)).toBeInTheDocument();
    expect(categoryHrefs()).toHaveLength(0);
  });
});
