/**
 * Responses for the markdown versions of pages. The HTML page stays the
 * canonical one: every markdown response is noindex and points back at it, so
 * search engines never see two copies of the same content.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
};

export function markdownResponse(
  body: string,
  { canonical, status = 200, head = false }: { canonical?: string; status?: number; head?: boolean },
): Response {
  const headers: Record<string, string> = {
    ...CORS,
    "Content-Type": "text/markdown; charset=utf-8",
    "X-Robots-Tag": "noindex, follow",
    // Rough token count (chars / 4), for agents deciding what to fetch.
    "X-Markdown-Tokens": String(Math.ceil(body.length / 4)),
    "Cache-Control":
      status === 200
        ? "public, s-maxage=3600, stale-while-revalidate=86400"
        : "public, s-maxage=300",
  };
  if (canonical) {
    headers["Content-Location"] = canonical;
    headers["Link"] = `<${canonical}>; rel="canonical"`;
  }
  return new Response(head ? null : body, { status, headers });
}

export function optionsResponse(): Response {
  return new Response(null, { status: 204, headers: { ...CORS, "Access-Control-Max-Age": "86400" } });
}
