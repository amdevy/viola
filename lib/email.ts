import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

type OrderItemRow = {
  quantity: number;
  price: number;
  products: { name: string } | null;
};

type OrderRow = {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  city: string;
  nova_poshta_address: string;
  total: number;
  notes: string | null;
  payment_type: string | null;
  status: string;
  order_items: OrderItemRow[];
};

type EmailKind = "paid" | "callback";

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const formatUAH = (n: number) => `${Number(n).toLocaleString("uk-UA")} грн`;

function buildHtml(order: OrderRow, kind: EmailKind, siteUrl: string): string {
  const shortId = order.id.slice(0, 8).toUpperCase();
  const itemsHtml = order.order_items
    .map((i) => {
      const name = escape(i.products?.name ?? "—");
      const sum = formatUAH(i.price * i.quantity);
      return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #E8E4DE;color:#1A1A1A;font-size:14px;">
          ${name} <span style="color:#6B6B6B;">× ${i.quantity}</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #E8E4DE;color:#1A1A1A;font-size:14px;text-align:right;white-space:nowrap;">
          ${sum}
        </td>
      </tr>`;
    })
    .join("");

  const heading =
    kind === "paid"
      ? "Дякуємо! Платіж отримано"
      : "Дякуємо за замовлення!";
  const intro =
    kind === "paid"
      ? "Ваш платіж успішно зараховано. Ми вже почали обробляти замовлення та зв'яжемось щодо доставки."
      : "Ми отримали ваше замовлення та зателефонуємо найближчим часом для підтвердження.";

  return `<!doctype html>
<html lang="uk">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escape(heading)}</title>
  </head>
  <body style="margin:0;padding:0;background:#FAFAF8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF8;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid #E8E4DE;border-radius:4px;">
            <tr>
              <td style="padding:32px 32px 16px;text-align:center;border-bottom:1px solid #E8E4DE;">
                <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#1A1A1A;letter-spacing:1px;">VIOLA</div>
                <div style="font-size:11px;color:#6B6B6B;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">Косметика Na Gólov[y]</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#1A1A1A;margin:0 0 12px;">
                  ${escape(heading)}
                </h1>
                <p style="font-size:15px;color:#6B6B6B;line-height:1.6;margin:0 0 24px;">
                  ${escape(intro)}
                </p>
                <p style="font-size:14px;color:#A0A0A0;margin:0 0 24px;">
                  Номер замовлення:
                  <span style="font-family:monospace;color:#1A1A1A;font-weight:600;">${escape(shortId)}</span>
                </p>
                <h2 style="font-family:Georgia,serif;font-size:16px;font-weight:700;color:#1A1A1A;margin:0 0 8px;">Товари</h2>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
                  ${itemsHtml}
                  <tr>
                    <td style="padding:16px 0 0;color:#1A1A1A;font-size:15px;font-weight:700;">Разом</td>
                    <td style="padding:16px 0 0;color:#1A1A1A;font-size:15px;font-weight:700;text-align:right;white-space:nowrap;">
                      ${formatUAH(order.total)}
                    </td>
                  </tr>
                </table>
                <h2 style="font-family:Georgia,serif;font-size:16px;font-weight:700;color:#1A1A1A;margin:24px 0 8px;">Доставка</h2>
                <p style="font-size:14px;color:#1A1A1A;line-height:1.6;margin:0;">
                  ${escape(order.customer_name)}<br/>
                  ${escape(order.customer_phone)}<br/>
                  ${escape(order.city)}<br/>
                  ${escape(order.nova_poshta_address)}
                </p>
                ${
                  order.notes
                    ? `<h2 style="font-family:Georgia,serif;font-size:16px;font-weight:700;color:#1A1A1A;margin:24px 0 8px;">Коментар</h2>
                       <p style="font-size:14px;color:#6B6B6B;line-height:1.6;margin:0;">${escape(order.notes)}</p>`
                    : ""
                }
                <div style="margin-top:32px;text-align:center;">
                  <a href="${siteUrl}/shop" style="display:inline-block;background:#1A1A1A;color:#fff;text-decoration:none;padding:14px 28px;font-size:13px;font-weight:500;letter-spacing:1px;text-transform:uppercase;border-radius:4px;">
                    Перейти в магазин
                  </a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;background:#FAFAF8;border-top:1px solid #E8E4DE;text-align:center;font-size:12px;color:#6B6B6B;line-height:1.6;">
                Виникли питання? Напишіть нам:
                <a href="https://t.me/violagegedosh" style="color:#C4A882;text-decoration:none;">Telegram</a>
                · <a href="tel:+380500582175" style="color:#C4A882;text-decoration:none;">+380 50 058 21 75</a>
                <br/>
                Viola Hair &amp; Beauty Salon · Мукачево
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendOrderEmail(
  orderId: string,
  kind: EmailKind
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";

  if (!apiKey || !from || !supabaseUrl || !serviceKey) return false;

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, customer_name, customer_email, customer_phone, city, nova_poshta_address, total, notes, payment_type, status, order_items(quantity, price, products(name))"
    )
    .eq("id", orderId)
    .single<OrderRow>();

  if (error || !data || !data.customer_email) return false;

  const resend = new Resend(apiKey);
  const subject =
    kind === "paid"
      ? `Платіж отримано — замовлення #${data.id.slice(0, 8).toUpperCase()}`
      : `Замовлення прийнято — #${data.id.slice(0, 8).toUpperCase()}`;

  try {
    const { error: sendError } = await resend.emails.send({
      from,
      to: data.customer_email,
      subject,
      html: buildHtml(data, kind, siteUrl),
    });
    if (sendError) {
      console.error("Resend send error:", sendError);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Resend exception:", err);
    return false;
  }
}
