import { createClient } from "@supabase/supabase-js";

type OrderItemRow = {
  quantity: number;
  price: number;
  products: { name: string } | null;
};

type OrderRow = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  city: string;
  nova_poshta_address: string;
  total: number;
  notes: string | null;
  payment_status: string | null;
  payment_id: string | null;
  order_items: OrderItemRow[];
};

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function notifyPaidOrder(orderId: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!botToken || !chatId || !supabaseUrl || !serviceKey) return false;

  const supabase = createClient(supabaseUrl, serviceKey);

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, customer_name, customer_phone, customer_email, city, nova_poshta_address, total, notes, payment_status, payment_id, order_items(quantity, price, products(name))"
    )
    .eq("id", orderId)
    .single<OrderRow>();

  if (error || !data) {
    console.error("notifyPaidOrder: order not found", orderId, error);
    return false;
  }

  const itemLines = data.order_items
    .map((i) => {
      const name = i.products?.name ?? "—";
      const sum = (i.price * i.quantity).toLocaleString("uk-UA");
      return `  • ${escape(name)} × ${i.quantity} — ${sum} грн`;
    })
    .join("\n");

  const text = [
    `✅ <b>Замовлення оплачено карткою (LiqPay)</b>`,
    ``,
    `👤 <b>Клієнт:</b> ${escape(data.customer_name)}`,
    `📞 <b>Телефон:</b> ${escape(data.customer_phone)}`,
    data.customer_email ? `✉️ <b>Email:</b> ${escape(data.customer_email)}` : null,
    ``,
    `🏙 <b>Місто:</b> ${escape(data.city)}`,
    `🏢 <b>Відділення:</b> ${escape(data.nova_poshta_address)}`,
    ``,
    `🛍 <b>Товари:</b>`,
    itemLines,
    ``,
    `💰 <b>Сума:</b> ${Number(data.total).toLocaleString("uk-UA")} грн`,
    data.notes ? `📝 <b>Коментар:</b> ${escape(data.notes)}` : null,
    ``,
    `📌 <b>ID замовлення:</b> <code>${data.id.slice(0, 8).toUpperCase()}</code>`,
    data.payment_id ? `💳 <b>LiqPay payment_id:</b> <code>${escape(data.payment_id)}</code>` : null,
    data.payment_status ? `📊 <b>Статус LiqPay:</b> ${escape(data.payment_status)}` : null,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });

  if (!res.ok) {
    console.error("Telegram notifyPaidOrder error:", await res.text());
    return false;
  }
  return true;
}
