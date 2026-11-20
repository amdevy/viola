import { renderMarkdown, listMarkdownRoutes } from "@/lib/md/registry";
import { splitLocale, type MdLocale } from "@/lib/md/routes";
import { htmlUrl, link, list, mdUrl } from "@/lib/md/format";
import { markdownResponse, optionsResponse } from "@/lib/md/http";
import { SITE_URL } from "@/lib/site";

/**
 * The markdown version of every public page. /<path>.md is rewritten here in
 * next.config.ts, so /shop/x.md and /api/md/shop/x return the same thing.
 * /api/md/_catalog lists every page that has one.
 */

type Context = { params: Promise<{ path?: string[] }> };

async function catalog(): Promise<string> {
  const sections = await Promise.all(
    (["uk", "en"] as MdLocale[]).map(async (locale) => {
      const entries = await listMarkdownRoutes(locale);
      return `## ${locale}\n\n${list(entries.map((e) => `${link(e.title, mdUrl(e.path, locale))} — ${htmlUrl(e.path, locale)}`))}`;
    }),
  );
  return `# Markdown catalog\n\n> Every page on this site that has a markdown version, by locale. Each line: markdown URL — canonical HTML URL.\n\n${sections.join("\n\n")}\n`;
}

async function handle(context: Context, head: boolean): Promise<Response> {
  const { path = [] } = await context.params;

  if (path.length === 1 && path[0] === "_catalog") {
    return markdownResponse(await catalog(), { head });
  }

  const { locale, path: pagePath } = splitLocale(path.join("/"));
  const body = await renderMarkdown(pagePath, locale);
  if (body === null) {
    const notFound =
      locale === "en"
        ? `# Not found\n\n> There is no markdown version of this page.\n\nSee the list of pages: ${SITE_URL}/llms.txt\n`
        : `# Сторінку не знайдено\n\n> Для цієї сторінки немає markdown-версії.\n\nПерелік сторінок: ${SITE_URL}/llms.txt\n`;
    return markdownResponse(notFound, { status: 404, head });
  }
  return markdownResponse(body, { canonical: htmlUrl(pagePath === "/index" ? "/" : pagePath, locale), head });
}

export async function GET(_request: Request, context: Context) {
  return handle(context, false);
}

export async function HEAD(_request: Request, context: Context) {
  return handle(context, true);
}

export function OPTIONS() {
  return optionsResponse();
}
