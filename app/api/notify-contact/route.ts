import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { escapeHtml, sendTelegram } from "@/lib/telegram";
import { rateLimitRequest } from "@/lib/rate-limit";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(30).optional().nullable(),
  email: z.string().trim().max(200).optional().nullable(),
  message: z.string().trim().max(2000).optional().nullable(),
});

export async function POST(req: NextRequest) {
  if (!rateLimitRequest(req, "notify-contact", 5, 60_000)) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const { name, phone, email, message } = parsed.data;

  const text = [
    `📩 <b>Запит на консультацію</b>`,
    ``,
    `👤 <b>Ім'я:</b> ${escapeHtml(name)}`,
    phone ? `📞 <b>Телефон:</b> ${escapeHtml(phone)}` : null,
    email ? `✉️ <b>Email:</b> ${escapeHtml(email)}` : null,
    message ? `💬 <b>Повідомлення:</b> ${escapeHtml(message)}` : null,
  ]
    .filter((line) => line !== null)
    .join("\n");

  if (!(await sendTelegram(text))) {
    return NextResponse.json({ error: "notify_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
