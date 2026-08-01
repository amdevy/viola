import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { rateLimitRequest } from "@/lib/rate-limit";

const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? "";
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";

/**
 * Submits our own URLs to IndexNow. Called from the admin panel after a product
 * or post is published, so it requires an admin session: it spends the site's
 * IndexNow key, and an open endpoint let anyone submit arbitrary URL lists
 * under our key.
 */
export async function POST(req: NextRequest) {
  if (!INDEXNOW_KEY) {
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }
  if (!rateLimitRequest(req, "indexnow", 30, 60_000)) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Being signed in is not being an admin — anyone can register against the
  // public anon key. Check membership the same way the RLS policies do.
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const urls = (body as { urls?: unknown })?.urls;
  if (!Array.isArray(urls) || urls.length === 0 || urls.length > 100) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const host = new URL(BASE).hostname;

  // Only our own URLs — IndexNow rejects foreign hosts anyway, but this keeps
  // the key from ever being spent on someone else's site.
  const urlList: string[] = [];
  for (const raw of urls) {
    if (typeof raw !== "string") continue;
    const absolute = raw.startsWith("http") ? raw : `${BASE}${raw.startsWith("/") ? "" : "/"}${raw}`;
    try {
      if (new URL(absolute).hostname === host) urlList.push(absolute);
    } catch {
      // Skip unparseable entries.
    }
  }

  if (urlList.length === 0) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      host,
      key: INDEXNOW_KEY,
      keyLocation: `${BASE}/${INDEXNOW_KEY}.txt`,
      urlList,
    }),
  });

  return NextResponse.json({ status: res.status, ok: res.ok });
}
