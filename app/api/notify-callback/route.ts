import { NextRequest, NextResponse } from "next/server";

const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

export async function POST(req: NextRequest) {
  const { orderId, customer, items, total, notes, city, novaPoshtaAddress } = await req.json();

  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const itemLines = (items as { name: string; price: number; qty: number }[])
    .map((i) => `  • ${escape(i.name)} × ${i.qty} — ${(i.price * i.qty).toLocaleString("uk-UA")} грн`)
    .join("\n");

  const text = [
    `📦 <b>Нове замовлення — зворотній зв'язок</b>`,
    ``,
    `👤 <b>Клієнт:</b> ${escape(customer.name)}`,
    `📞 <b>Телефон:</b> ${escape(customer.phone)}`,
    ``,
    `🏙 <b>Місто:</b> ${escape(city ?? "")}`,
    `🏢 <b>Відділення:</b> ${escape(novaPoshtaAddress ?? "")}`,
    ``,
    `🛍 <b>Товари:</b>`,
    itemLines,
    ``,
    `💰 <b>Сума:</b> ${total.toLocaleString("uk-UA")} грн`,
    notes ? `📝 <b>Коментар:</b> ${escape(notes)}` : null,
    ``,
    `📌 <b>ID замовлення:</b> <code>${String(orderId).slice(0, 8).toUpperCase()}</code>`,
    ``,
    `<i>Клієнт бажає, щоб з ним зв'язалися.</i>`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const res = await fetch(TELEGRAM_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Telegram notify error:", err);
    return NextResponse.json({ error: "Telegram error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
