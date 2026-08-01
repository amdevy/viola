import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { rateLimitRequest } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // A like is one tap; anything beyond a handful a minute from one address is
    // a script inflating social proof.
    if (!rateLimitRequest(req, "product-like", 20, 60_000)) {
      return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
    }

    const body = await req.json();
    const productId = (body?.productId ?? "").toString().trim();
    const action = (body?.action ?? "").toString();

    if (!productId.match(/^[0-9a-f-]{36}$/i)) {
      return NextResponse.json({ error: "invalid_product_id" }, { status: 400 });
    }
    if (action !== "like" && action !== "unlike") {
      return NextResponse.json({ error: "invalid_action" }, { status: 400 });
    }

    const delta = action === "like" ? 1 : -1;
    const supabase = await createAdminClient();
    const { data, error } = await supabase.rpc("bump_product_likes", {
      p_id: productId,
      p_delta: delta,
    });

    if (error) {
      console.error("bump_product_likes error:", error);
      return NextResponse.json({ error: "rpc_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, likes_count: data ?? 0 });
  } catch (e) {
    console.error("/api/products/like error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
