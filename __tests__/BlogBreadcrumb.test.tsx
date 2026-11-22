import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import uk from "@/messages/uk.json";

vi.mock("next-intl/server", async () => {
  const { createTranslator } = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    setRequestLocale: () => {},
    getTranslations: async ({ namespace }: { namespace: string }) =>
      createTranslator({ locale: "uk", messages: uk, namespace: namespace as never }),
  };
});

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("not found"); } }));

const TITLE =
  "Як підібрати догляд На Голову для фарбованого волосся, щоб колір тримався довше";

vi.mock("@/lib/blog", () => ({
  getPublishedPost: async () => ({
    slug: "doglyad-farbovane",
    title: TITLE,
    excerpt: "Коротко.",
    content: "Текст статті.",
    cover_image: null,
    published_at: "2026-10-01T00:00:00Z",
    reading_time: 4,
  }),
}));

describe("Стаття блогу — хлібні крихти", () => {
  it("останній пункт крихт містить повну назву статті, хоч на телефоні й обрізаний", async () => {
    // На вузькому екрані назву обрізає три крапки (CSS), але в HTML вона
    // лишається повністю.
    const { default: BlogPostPage } = await import("@/app/(public)/[locale]/blog/[slug]/page");
    render(await BlogPostPage({ params: Promise.resolve({ slug: "doglyad-farbovane", locale: "uk" }) }));

    const trail = screen.getByRole("link", { name: uk.blogPost.blog }).closest("nav")!;
    expect(trail.lastElementChild).toHaveTextContent(TITLE);
    expect(trail.lastElementChild?.textContent).toBe(TITLE);
  });
});
