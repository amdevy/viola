import { NextRequest, NextResponse } from "next/server";
import { searchCities, getWarehouses } from "@/lib/nova-poshta";
import { rateLimitRequest } from "@/lib/rate-limit";

// The upstream fetch cannot be cached by Next (it is a POST, so
// `next: { revalidate }` is a no-op), and the API key is the shop's. Cache here
// instead, keyed on the normalised query, so repeated lookups — an ordinary
// shopper types the same city name on every visit — cost nothing upstream.
const TTL_MS = 60 * 60 * 1000;
const MAX_ENTRIES = 500;
const cache = new Map<string, { at: number; data: unknown }>();

function cacheGet(key: string): unknown | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > TTL_MS) {
    cache.delete(key);
    return undefined;
  }
  return hit.data;
}

function cacheSet(key: string, data: unknown) {
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { at: Date.now(), data });
}

const NP_REF = /^[0-9a-f-]{36}$/i;

export async function GET(req: NextRequest) {
  if (!rateLimitRequest(req, "nova-poshta", 60, 60_000)) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type");
  const query = (searchParams.get("query") ?? "").trim().slice(0, 100).toLowerCase();
  const cityRef = (searchParams.get("cityRef") ?? "").trim();

  try {
    if (type === "cities") {
      // Below three characters the result set is meaningless anyway, and every
      // distinct string is a distinct upstream call.
      if (query.length < 3) return NextResponse.json({ data: [] });

      const key = `cities:${query}`;
      const cached = cacheGet(key);
      if (cached) return NextResponse.json({ data: cached });

      const data = await searchCities(query);
      cacheSet(key, data);
      return NextResponse.json(
        { data },
        { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
      );
    }

    if (type === "warehouses") {
      if (!NP_REF.test(cityRef)) {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
      }

      const key = `warehouses:${cityRef}:${query}`;
      const cached = cacheGet(key);
      if (cached) return NextResponse.json({ data: cached });

      const data = await getWarehouses(cityRef, query);
      cacheSet(key, data);
      return NextResponse.json(
        { data },
        { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
      );
    }

    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  } catch (err) {
    console.error("nova-poshta: upstream request failed", err);
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}
