import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { orderRequestSchema } from "@/lib/validations";
import { rateLimitRequest } from "@/lib/rate-limit";

type ProductRow = {
  id: string;
  name: string;
  price: number;
  in_stock: boolean | null;
  is_coming_soon: boolean | null;
};

export async function POST(req: NextRequest) {
  if (!rateLimitRequest(req, "orders", 10, 60_000)) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const parsed = orderRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const {
    firstName,
    lastName,
    phone,
    email,
    city,
    novaPoshtaRef,
    novaPoshtaAddress,
    paymentMethod,
    notes,
    locale,
    items,
  } = parsed.data;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Prices come from the database, never from the request. Anything the client
  // sends as price/total is discarded — this is the only place the amount that
  // will eventually be charged is decided.
  const productIds = [...new Set(items.map((i) => i.productId))];
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, price, in_stock, is_coming_soon")
    .in("id", productIds);

  if (productsError) {
    console.error("orders: product lookup failed", productsError);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  const byId = new Map((products as ProductRow[]).map((p) => [p.id, p]));

  const missing = productIds.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    return NextResponse.json({ error: "product_unavailable" }, { status: 409 });
  }

  const unavailable = (products as ProductRow[]).filter(
    (p) => p.in_stock === false || p.is_coming_soon === true
  );
  if (unavailable.length > 0) {
    return NextResponse.json(
      { error: "product_unavailable", products: unavailable.map((p) => p.name) },
      { status: 409 }
    );
  }

  const pricedItems = items.map((i) => {
    const product = byId.get(i.productId)!;
    return { productId: i.productId, quantity: i.quantity, price: Number(product.price) };
  });

  const total = Number(
    pricedItems.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2)
  );

  if (!(total > 0)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // Upsert customer. A concurrent order with the same phone loses the race on
  // the UNIQUE index; re-select rather than leaving the order without a customer.
  let customerId: string | null = null;
  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (existingCustomer) {
    customerId = existingCustomer.id;
  } else {
    const { data: newCustomer, error: customerError } = await supabase
      .from("customers")
      .insert({ name: `${firstName} ${lastName}`, phone, email: email || null })
      .select("id")
      .single();

    if (customerError) {
      const { data: raced } = await supabase
        .from("customers")
        .select("id")
        .eq("phone", phone)
        .maybeSingle();
      if (!raced) console.error("orders: customer upsert failed", customerError);
      customerId = raced?.id ?? null;
    } else {
      customerId = newCustomer?.id ?? null;
    }
  }

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      customer_id: customerId,
      customer_name: `${firstName} ${lastName}`,
      customer_phone: phone,
      customer_email: email || null,
      city,
      nova_poshta_ref: novaPoshtaRef,
      nova_poshta_address: novaPoshtaAddress,
      total,
      notes: notes || null,
      status: "pending",
      payment_type: paymentMethod,
      locale: locale ?? "uk",
      offer_accepted_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !order) {
    console.error("orders: order insert failed", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  // An order whose line items failed to insert would still carry a total and
  // could still be charged, so treat a partial write as a failed order.
  const { error: itemsError } = await supabase.from("order_items").insert(
    pricedItems.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      price: item.price,
    }))
  );

  if (itemsError) {
    console.error("orders: order_items insert failed, rolling back", order.id, itemsError);
    await supabase.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  await supabase.from("orders").update({ payment_id: order.id }).eq("id", order.id);

  return NextResponse.json({ orderId: order.id, total });
}
