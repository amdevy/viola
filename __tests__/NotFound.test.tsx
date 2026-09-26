import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import NotFound, { generateMetadata as notFoundMetadata } from "@/app/(public)/[locale]/not-found";
import CatchAllPage, { generateMetadata as catchAllMetadata } from "@/app/(public)/[locale]/[...rest]/page";
import uk from "@/messages/uk.json";
import type { CategoryNode } from "@/lib/categories";

const { notFound } = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({ notFound }));

vi.mock("next-intl/server", () => ({
  getLocale: async () => "uk",
  getTranslations: async ({ namespace }: { namespace: string }) => (key: string) =>
    ((uk as Record<string, Record<string, string>>)[namespace] ?? {})[key] ?? `${namespace}.${key}`,
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

vi.mock("@next/third-parties/google", () => ({ sendGAEvent: vi.fn() }));

vi.mock("@/lib/categories-server", () => ({
  getCategoryTree: async (): Promise<CategoryNode[]> => [
    { id: "1", slug: "shampoos", name: "Шампуні", productCount: 17, children: [] } as unknown as CategoryNode,
    { id: "2", slug: "masks", name: "Маски", productCount: 12, children: [] } as unknown as CategoryNode,
  ],
}));

describe("сторінка 404", () => {
  it("веде в каталог, у категорії, до бренду й технолога", async () => {
    render(await NotFound());

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Такої сторінки немає");
    expect(screen.getByRole("link", { name: "Перейти в каталог" })).toHaveAttribute("href", "/shop");
    expect(screen.getByRole("link", { name: "Запитати технолога" })).toHaveAttribute(
      "href",
      "https://t.me/violagegedosh",
    );

    const sections = Array.from(
      screen.getByRole("navigation", { name: "Популярні розділи" }).querySelectorAll("a"),
    ).map((a) => [a.textContent, a.getAttribute("href")]);
    expect(sections).toEqual([
      ["Шампуні", "/shop/category/shampoos"],
      ["Маски", "/shop/category/masks"],
      ["Бренд На Голову", "/na-golovy"],
      ["Блог", "/blog"],
    ]);
  });

  it("не індексується і має свій заголовок вкладки", async () => {
    // Заголовок і на самій 404, і на «ловці» невідомих адрес: браузер домальовує
    // 404 з payload-у й бере заголовок сторінки, а не not-found — інакше вкладка
    // перемикалась на заголовок головної.
    for (const meta of [await notFoundMetadata(), await catchAllMetadata({ params: Promise.resolve({ locale: "uk" }) })]) {
      expect(meta.title).toBe("Сторінку не знайдено | Viola");
      expect(meta.robots).toEqual({ index: false, follow: true });
    }
  });

  it("невідома адреса віддає 404, а не порожню сторінку", () => {
    expect(() => CatchAllPage()).toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });
});
