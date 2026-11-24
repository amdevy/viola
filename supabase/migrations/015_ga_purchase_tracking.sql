-- GA4 `purchase` for paid card orders, sent from the server.
--
-- The browser reports `purchase` only on /checkout/success, after LiqPay sends
-- the shopper back. A shopper who pays and closes the LiqPay page never comes
-- back, so GA never heard of that sale. The LiqPay callback now reports it
-- through the GA4 Measurement Protocol (lib/ga-server.ts), and needs:
--
--   ga_client_id         GA client id from the shopper's `_ga` cookie, read by
--                        /api/orders when a card order is placed. Without it the
--                        event cannot join the shopper's GA user.
--   ga_session_id        session id from the `_ga_<stream>` cookie, so the
--                        purchase lands in the same session (source/medium).
--   ga_purchase_sent_at  who-reports-this-order marker. Claimed with a
--   ga_purchase_sent_by  compare-and-set (… WHERE ga_purchase_sent_at IS NULL),
--                        so the server and the success page never both send a
--                        `purchase` for one order. 'server' = sent through the
--                        Measurement Protocol; 'browser' = left to gtag on the
--                        success page (which may still have been blocked).
--
-- The code tolerates this migration not having run yet: it then behaves as
-- before (browser-only purchase). Re-runnable.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS ga_client_id        TEXT,
  ADD COLUMN IF NOT EXISTS ga_session_id       TEXT,
  ADD COLUMN IF NOT EXISTS ga_purchase_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ga_purchase_sent_by TEXT;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_ga_purchase_sent_by_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_ga_purchase_sent_by_check
  CHECK (ga_purchase_sent_by IS NULL OR ga_purchase_sent_by IN ('server', 'browser'));

COMMENT ON COLUMN public.orders.ga_client_id IS
  'GA4 client id from the _ga cookie at checkout (card orders only).';
COMMENT ON COLUMN public.orders.ga_session_id IS
  'GA4 session id from the _ga_<stream> cookie at checkout.';
COMMENT ON COLUMN public.orders.ga_purchase_sent_at IS
  'When the GA4 purchase for this order was claimed; set once, by the server or the success page.';
COMMENT ON COLUMN public.orders.ga_purchase_sent_by IS
  'server = sent via Measurement Protocol; browser = left to gtag on the success page.';

-- !! VERIFY AFTER RUNNING — expect four rows !!
--   select column_name from information_schema.columns
--   where table_schema = 'public' and table_name = 'orders' and column_name like 'ga\_%';
