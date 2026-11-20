import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { MD_PATTERNS, MD_SKIPPED, matchMdPattern, splitLocale } from "@/lib/md/routes";
import { blogTextToMarkdown, htmlToMarkdown, link, mdUrl } from "@/lib/md/format";

const PAGES_DIR = path.resolve(__dirname, "../app/(public)/[locale]");

/** "shop/[slug]/page.tsx" → "/shop/[slug]"; route groups "(x)" don't add a segment. */
function publicPagePatterns(dir = PAGES_DIR, prefix = ""): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isFile() && entry.name === "page.tsx") return [prefix || "/"];
    if (!entry.isDirectory()) return [];
    const segment = /^\(.*\)$/.test(entry.name) ? "" : `/${entry.name}`;
    return publicPagePatterns(path.join(dir, entry.name), prefix + segment);
  });
}

describe("markdown coverage", () => {
  it("gives every public page a markdown renderer or a reason to skip it", () => {
    const covered = new Set<string>([...MD_PATTERNS, ...Object.keys(MD_SKIPPED)]);
    const missing = publicPagePatterns().filter((p) => !covered.has(p));
    expect(missing).toEqual([]);
  });

  it("lists no pattern that has no page behind it", () => {
    const pages = new Set(publicPagePatterns());
    expect(MD_PATTERNS.filter((p) => !pages.has(p))).toEqual([]);
  });
});

describe("markdown paths", () => {
  it("reads the locale off the path", () => {
    expect(splitLocale("en/shop/x")).toEqual({ locale: "en", path: "/shop/x" });
    expect(splitLocale("en")).toEqual({ locale: "en", path: "/" });
    expect(splitLocale("shop/x")).toEqual({ locale: "uk", path: "/shop/x" });
    // "/english-post" is not the English locale.
    expect(splitLocale("blog/english-post").locale).toBe("uk");
  });

  it("matches static, dynamic and index paths", () => {
    expect(matchMdPattern("/")?.pattern).toBe("/");
    expect(matchMdPattern("/index")?.pattern).toBe("/");
    expect(matchMdPattern("/shop/category/masks")).toEqual({
      pattern: "/shop/category/[slug]",
      params: { slug: "masks" },
    });
    expect(matchMdPattern("/shop/kolahenovyy-shampun")).toEqual({
      pattern: "/shop/[slug]",
      params: { slug: "kolahenovyy-shampun" },
    });
    expect(matchMdPattern("/shop/category")).toBeNull();
    expect(matchMdPattern("/checkout")).toBeNull();
    expect(matchMdPattern("/admin/orders")).toBeNull();
  });

  it("builds .md URLs, with /index.md for the homepage", () => {
    expect(mdUrl("/", "uk")).toMatch(/\/index\.md$/);
    expect(mdUrl("/", "en")).toMatch(/\/en\/index\.md$/);
    expect(mdUrl("/shop", "en")).toMatch(/\/en\/shop\.md$/);
  });
});

describe("markdown formatting", () => {
  it("escapes the brackets in the brand name inside link text", () => {
    expect(link("Маска Na Gólov[y]", "https://x")).toBe("[Маска Na Gólov\\[y\\]](https://x)");
  });

  it("turns the HTML in translations into markdown", () => {
    expect(htmlToMarkdown("Оплата <strong>100% передоплатою</strong> через LiqPay")).toBe(
      "Оплата **100% передоплатою** через LiqPay",
    );
  });

  it("renders blog text the way the post page does", () => {
    const plain = "Вступ.\n\nЩо робить процедура?\n• відновлює\n• зволожує\n\nВисновок.";
    expect(blogTextToMarkdown(plain)).toBe("Вступ.\n\nЩо робить процедура?\n\n- відновлює\n- зволожує\n\nВисновок.");

    const html = "Intro.<br>What does it do?<br>• restores<br>• moisturizes";
    expect(blogTextToMarkdown(html)).toBe("Intro.\n\nWhat does it do?\n\n- restores\n- moisturizes");
  });
});
