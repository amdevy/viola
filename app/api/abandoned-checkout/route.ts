import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { normalizeUkrainianPhone, UUID_RE } from "@/lib/validations";
import { rateLimitRequest } from "@/lib/rate-limit";

// Capture-only for now: records a checkout-in-progress once a valid phone is
// entered, and flips it to 'ordered' when that phone completes an order.
// No outreach yet — we're measuring the abandonment rate first.

const PHONE_RE = /^\+380\d{9}$/;

const captureSchema = z.object({
  phone: z.string().max(30),
  name: z.string().trim().max(200).optional().nullable(),
  email: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().max(200).optional().nullable(),
  npAddress: z.string().trim().max(500).optional().nullable(),
  total: z.number().min(0).max(10_000_000).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().max(100),
        name: z.string().max(300),
        price: z.number().min(0).max(1_000_000),
        quantity: z.number().int().min(1).max(1000),
      })
    )
    .max(50)
    .optional(),
});

const orderedSchema = z.object({
  action: z.literal("ordered"),
  phone: z.string().max(30),
  // Proof the caller actually placed this order. Without it, knowing a phone
  // number was enough to mark someone else's abandoned cart as converted and
  // permanently exclude them from recovery.
  orderId: z.string().regex(UUID_RE),
});

export async function POST(req: NextRequest) {
  if (!rateLimitRequest(req, "abandoned-checkout", 30, 60_000)) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Mark a previously-captured checkout as completed.
  if ((body as { action?: unknown })?.action === "ordered") {
    const parsed = orderedSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }

    const phone = normalizeUkrainianPhone(parsed.data.phone);
    if (!PHONE_RE.test(phone)) {
      return NextResponse.json({ ok: true, skipped: "invalid_phone" });
    }

    // The order must exist and belong to this phone.
    const { data: order } = await supabase
      .from("orders")
      .select("id")
      .eq("id", parsed.data.orderId)
      .eq("customer_phone", phone)
      .maybeSingle();

    if (!order) {
      return NextResponse.json({ error: "order_not_found" }, { status: 404 });
    }

    await supabase
      .from("abandoned_checkouts")
      .update({ status: "ordered", updated_at: new Date().toISOString() })
      .eq("phone", phone);
    return NextResponse.json({ ok: true });
  }

  const parsed = captureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const phone = normalizeUkrainianPhone(parsed.data.phone);
  if (!PHONE_RE.test(phone)) {
    // Silently ignore — the form calls this on every keystroke; an incomplete
    // phone is expected, not an error.
    return NextResponse.json({ ok: true, skipped: "invalid_phone" });
  }

  const items = parsed.data.items ?? [];
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);

  const { error } = await supabase.from("abandoned_checkouts").upsert(
    {
      phone,
      name: parsed.data.name || null,
      email: parsed.data.email || null,
      items,
      item_count: itemCount,
      total: parsed.data.total ?? 0,
      city: parsed.data.city || null,
      np_address: parsed.data.npAddress || null,
      status: "pending",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "phone" }
  );

  if (error) {
    console.error("abandoned-checkout: upsert failed", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
