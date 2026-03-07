import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    firstName,
    lastName,
    phone,
    email,
    city,
    cityRef,
    novaPoshtaRef,
    novaPoshtaAddress,
    paymentMethod,
    notes,
    items,
    total,
  } = body;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Upsert customer
  let customerId: string | null = null;
  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("phone", phone)
    .single();

  if (existingCustomer) {
    customerId = existingCustomer.id;
  } else {
    const { data: newCustomer } = await supabase
      .from("customers")
      .insert({ name: `${firstName} ${lastName}`, phone, email: email || null })
      .select("id")
      .single();
    customerId = newCustomer?.id ?? null;
  }

  // Create order
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
      status: paymentMethod === "cash" ? "pending" : "pending",
      payment_id: null,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Insert order items
  if (items?.length) {
    await supabase.from("order_items").insert(
      items.map((item: { productId: string; quantity: number; price: number }) => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price,
      }))
    );
  }

  // Set payment_id to order id for WFP reference
  await supabase
    .from("orders")
    .update({ payment_id: order.id })
    .eq("id", order.id);

  return NextResponse.json({ orderId: order.id });
}
