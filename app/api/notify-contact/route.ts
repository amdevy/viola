import { NextRequest, NextResponse } from "next/server";

const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

export async function POST(req: NextRequest) {
  const { name, phone, email, message } = await req.json();

  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const text = [
    `📩 <b>Запит на консультацію</b>`,
    ``,
    `👤 <b>Ім'я:</b> ${escape(name ?? "")}`,
    phone ? `📞 <b>Телефон:</b> ${escape(phone)}` : null,
    `✉️ <b>Email:</b> ${escape(email ?? "")}`,
    message ? `💬 <b>Повідомлення:</b> ${escape(message)}` : null,
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
    console.error("Telegram contact notify error:", err);
    return NextResponse.json({ error: "Telegram error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
