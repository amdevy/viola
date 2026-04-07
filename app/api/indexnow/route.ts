import { NextRequest, NextResponse } from "next/server";

const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? "";
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";

export async function POST(req: NextRequest) {
  if (!INDEXNOW_KEY) {
    return NextResponse.json({ error: "INDEXNOW_KEY not configured" }, { status: 500 });
  }

  const { urls } = (await req.json()) as { urls?: string[] };
  if (!urls || urls.length === 0) {
    return NextResponse.json({ error: "No urls provided" }, { status: 400 });
  }

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      host: new URL(BASE).hostname,
      key: INDEXNOW_KEY,
      keyLocation: `${BASE}/${INDEXNOW_KEY}.txt`,
      urlList: urls.map((u) => (u.startsWith("http") ? u : `${BASE}${u}`)),
    }),
  });

  return NextResponse.json({ status: res.status, ok: res.ok });
}
