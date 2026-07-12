import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeUkrainianPhone } from "@/lib/validations";

// Capture-only for now: records a checkout-in-progress once a valid phone is
// entered, and flips it to 'ordered' when that phone completes an order.
// No outreach yet — we're measuring the abandonment rate first.

const PHONE_RE = /^\+380\d{9}$/;

type CaptureItem = { productId: string; name: string; price: number; quantity: number };

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const phone = normalizeUkrainianPhone(String(body.phone ?? ""));
  if (!PHONE_RE.test(phone)) {
    // Silently ignore — the form calls this on every keystroke; an incomplete
    // phone is expected, not an error.
    return NextResponse.json({ ok: true, skipped: "invalid_phone" });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Mark a previously-captured checkout as completed.
  if (body.action === "ordered") {
    await supabase
      .from("abandoned_checkouts")
      .update({ status: "ordered", updated_at: new Date().toISOString() })
      .eq("phone", phone);
    return NextResponse.json({ ok: true });
  }

  // Default: capture / update the in-progress checkout.
  const items = Array.isArray(body.items) ? (body.items as CaptureItem[]) : [];
  const itemCount = items.reduce((n, i) => n + (Number(i.quantity) || 0), 0);

  const { error } = await supabase.from("abandoned_checkouts").upsert(
    {
      phone,
      name: (body.name as string) || null,
      email: (body.email as string) || null,
      items,
      item_count: itemCount,
      total: Number(body.total) || 0,
      city: (body.city as string) || null,
      np_address: (body.npAddress as string) || null,
      status: "pending",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "phone" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
