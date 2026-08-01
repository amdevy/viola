import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { escapeHtml, sendTelegram } from "@/lib/telegram";
import { rateLimitRequest } from "@/lib/rate-limit";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(5).max(30),
  productName: z.string().trim().min(1).max(200),
  // Validated as a slug rather than escaped, because it is built into a URL.
  // Permissive on case and separators (existing slugs were not all machine-made),
  // strict on everything that could break out of the URL or the message.
  productSlug: z
    .string()
    .regex(/^[A-Za-z0-9._-]+$/)
    .max(200)
    .optional()
    .nullable(),
  status: z.enum(["coming_soon", "out_of_stock"]).optional(),
});

export async function POST(req: NextRequest) {
  if (!rateLimitRequest(req, "notify-stock", 5, 60_000)) {
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
  const { name, phone, productName, productSlug, status } = parsed.data;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";
  const productUrl = productSlug ? `${siteUrl}/shop/${productSlug}` : null;
  const statusLabel = status === "coming_soon" ? "Очікується" : "Немає в наявності";

  const text = [
    `🔔 <b>Заявка на сповіщення</b>`,
    ``,
    `👤 <b>Клієнт:</b> ${escapeHtml(name)}`,
    `📞 <b>Телефон:</b> ${escapeHtml(phone)}`,
    ``,
    `🛍 <b>Товар:</b> ${escapeHtml(productName)}`,
    `📦 <b>Статус:</b> ${statusLabel}`,
    productUrl ? `🔗 ${escapeHtml(productUrl)}` : null,
    ``,
    `<i>Клієнт чекає коли товар з'явиться. Зв'яжіться з ним.</i>`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  if (!(await sendTelegram(text))) {
    return NextResponse.json({ error: "notify_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
