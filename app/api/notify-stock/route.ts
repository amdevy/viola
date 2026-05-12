import { NextRequest, NextResponse } from "next/server";

const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

export async function POST(req: NextRequest) {
  const { name, phone, productName, productSlug, status } = await req.json();

  if (!name || !phone || !productName) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const escape = (s: string) =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";
  const productUrl = productSlug ? `${siteUrl}/shop/${productSlug}` : null;
  const statusLabel = status === "coming_soon" ? "Очікується" : "Немає в наявності";

  const text = [
    `🔔 <b>Заявка на сповіщення</b>`,
    ``,
    `👤 <b>Клієнт:</b> ${escape(name)}`,
    `📞 <b>Телефон:</b> ${escape(phone)}`,
    ``,
    `🛍 <b>Товар:</b> ${escape(productName)}`,
    `📦 <b>Статус:</b> ${statusLabel}`,
    productUrl ? `🔗 ${productUrl}` : null,
    ``,
    `<i>Клієнт чекає коли товар з'явиться. Зв'яжіться з ним.</i>`,
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
    console.error("Telegram notify-stock error:", err);
    return NextResponse.json({ error: "Telegram error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
