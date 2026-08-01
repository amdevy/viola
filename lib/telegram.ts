// Telegram notifications are sent with parse_mode: "HTML", so every value
// interpolated into a message must be escaped — otherwise anyone who can reach
// a notify-* endpoint can render a clickable link inside a message the owner
// trusts. Values are coerced to string first: the old per-route helper called
// .replace() directly and threw on numbers.

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendTelegram(text: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    console.error("sendTelegram: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing");
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });

    if (!res.ok) {
      console.error("sendTelegram: Telegram API error", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("sendTelegram: request failed", err);
    return false;
  }
}
