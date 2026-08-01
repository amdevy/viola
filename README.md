# Viola — інтернет-магазин косметики Na Gólov[y]

Сайт салону краси Viola (Мукачево) та магазин професійної аромакосметики для волосся
Na Gólov[y]. Next.js 16 (App Router), TypeScript, Supabase, LiqPay, Нова Пошта.

Повний опис структури — в [architecture.md](architecture.md).
Перелік відкритих задач і знайдених проблем — у [IMPROVEMENT-PLAN.md](IMPROVEMENT-PLAN.md).

## Запуск

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # vitest
npm run build    # продакшн-збірка
```

## Змінні оточення (`.env.local`)

| Змінна | Призначення |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL проекту Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Публічний ключ (потрапляє в браузер) |
| `SUPABASE_SERVICE_ROLE_KEY` | Сервісний ключ, лише в API-роутах — обходить RLS |
| `LIQPAY_PUBLIC_KEY` | Ключ LiqPay. Префікс `sandbox_` вмикає тестовий режим |
| `LIQPAY_PRIVATE_KEY` | Приватний ключ LiqPay (підпис платежів) |
| `NEXT_PUBLIC_SITE_URL` | Публічний origin. **У проді — https і без слеша в кінці** |
| `NOVA_POSHTA_API_KEY` | Ключ API Нової Пошти |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Сповіщення про замовлення |
| `RESEND_API_KEY` | Листи-підтвердження клієнтам |
| `INDEXNOW_KEY` | Подача URL у IndexNow з адмінки |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 |

## Оплата

Карткова оплата йде через LiqPay: сервер підписує суму, взяту **з бази**
(`orders.total`), клієнт лише відправляє готову форму. Ціни та суми, що приходять
із браузера, ігноруються — див. [lib/payments.ts](lib/payments.ts) і
[app/api/orders/route.ts](app/api/orders/route.ts).

`assertLiqPayEnv()` не дасть застосунку приймати картки в продакшні з
sandbox-ключами або з `localhost` у `NEXT_PUBLIC_SITE_URL` — обидві помилки
призводили б до «оплачених» замовлень без грошей.

Локально серверний callback від LiqPay не доходить (він не бачить localhost) —
статус звіряється на success-сторінці через status API. Для повного тесту
callback потрібен тунель (ngrok / cloudflared) і публічний URL у `NEXT_PUBLIC_SITE_URL`.

## Міграції БД

SQL у [supabase/migrations/](supabase/migrations/) — застосовувати по порядку.
Міграція `012` вводить таблицю `public.admins`: доступ до даних магазину й до
адмінки мають **лише** користувачі, чий `auth.uid()` є в цій таблиці. Після
застосування перевірте, що там саме власниця:

```sql
select a.email, u.created_at from public.admins a join auth.users u on u.id = a.user_id;
```

Також вимкніть самостійну реєстрацію: Supabase → Authentication → Providers →
Email → «Allow new users to sign up» = off.
