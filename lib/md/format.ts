import { SITE_URL } from "@/lib/site";
import type { MdLocale } from "@/lib/md/routes";

/** Absolute HTML URL of a page in a locale: "/shop" → https://…/en/shop. */
export function htmlUrl(path: string, locale: MdLocale): string {
  const prefix = locale === "en" ? "/en" : "";
  const rest = path === "/" ? "" : path;
  return `${SITE_URL}${prefix}${rest}`;
}

/** Absolute URL of the markdown version: "/" → /index.md, "/shop" → /shop.md. */
export function mdUrl(path: string, locale: MdLocale): string {
  const prefix = locale === "en" ? "/en" : "";
  return `${SITE_URL}${prefix}${path === "/" ? "/index" : path}.md`;
}

/** Text that goes inside [link text]: product names carry brackets ("Na Gólov[y]"). */
export function linkText(text: string): string {
  return text.replace(/\s+/g, " ").trim().replace(/([[\]])/g, "\\$1");
}

export function link(text: string, url: string): string {
  return `[${linkText(text)}](${url})`;
}

export function list(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

/** A two-column table of label → value; rows with an empty value are dropped. */
export function factsTable(rows: [string, string | null | undefined][]): string {
  const filled = rows.filter((row): row is [string, string] => Boolean(row[1]));
  if (filled.length === 0) return "";
  const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n+/g, " ");
  return ["| | |", "|---|---|", ...filled.map(([k, v]) => `| ${cell(k)} | ${cell(v)} |`)].join("\n");
}

export function isoDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().split("T")[0];
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  "#39": "'",
};

/**
 * The small slice of HTML the site stores — translation strings with <strong>,
 * English blog posts with <br> — as markdown. Not a general converter: tags it
 * doesn't know are dropped and their text kept.
 */
export function htmlToMarkdown(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*/gi, "\n\n")
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, text) => `\n\n${"#".repeat(Math.max(Number(level), 2))} ${text.trim()}\n\n`)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, text) => `\n- ${text.trim()}`)
    .replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, (_, __, text) => `**${text.trim()}**`)
    .replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, (_, __, text) => `_${text.trim()}_`)
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) =>
      link(text, href.startsWith("/") ? `${SITE_URL}${href}` : href),
    )
    .replace(/<[^>]+>/g, "")
    .replace(/&(#39|[a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Blog text as the post page shows it: blank lines split paragraphs, and lines
 * starting with "•" (or several "•" items run into one line) are a list.
 * English posts store the same layout with <br> instead of newlines.
 */
export function blogTextToMarkdown(content: string): string {
  const text = /<[a-z][\s\S]*>/i.test(content) ? htmlToMarkdown(content) : content;

  const blocks: string[] = [];
  for (const line of text.split("\n").map((l) => l.trim())) {
    if (!line) continue;
    if (line.startsWith("•")) {
      blocks.push(`- ${line.replace(/^•\s*/, "")}`);
    } else if ((line.match(/•/g) ?? []).length >= 2) {
      const [intro, ...items] = line.split(/\s*•\s*/).filter(Boolean);
      blocks.push(intro, ...items.map((item) => `- ${item}`));
    } else {
      blocks.push(line);
    }
  }

  // A blank line between paragraphs, none inside a run of list items.
  return blocks
    .map((block, i) => {
      const prev = blocks[i - 1];
      if (i === 0) return block;
      return block.startsWith("- ") && prev?.startsWith("- ") ? `\n${block}` : `\n\n${block}`;
    })
    .join("");
}

export interface MdPage {
  title: string;
  /** One sentence: the page's meta description or the closest thing to it. */
  summary: string;
  canonical: string;
  updated?: string;
  /** Main content, already markdown, in reading order. */
  body: string;
  related?: { text: string; url: string }[];
}

/** The common layout of every markdown page. */
export function renderMdPage(page: MdPage, locale: MdLocale): string {
  const parts = [
    `# ${page.title.trim()}`,
    `> ${page.summary.replace(/\s+/g, " ").trim()}`,
    [
      `Canonical: ${page.canonical}`,
      page.updated ? `${locale === "en" ? "Last updated" : "Оновлено"}: ${page.updated}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
    page.body.trim(),
  ];
  if (page.related && page.related.length > 0) {
    parts.push(
      `## ${locale === "en" ? "Related" : "Пов'язані сторінки"}\n\n${list(page.related.map((r) => link(r.text, r.url)))}`,
    );
  }
  return parts.filter(Boolean).join("\n\n") + "\n";
}

/**
 * `alternates.types` for a page's metadata: <link rel="alternate"
 * type="text/markdown"> pointing at its markdown version.
 */
export function markdownAlternate(path: string, locale: string): Record<string, string> {
  return { "text/markdown": mdUrl(path, locale === "en" ? "en" : "uk") };
}
