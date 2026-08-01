-- Security + payment-integrity migration.
--
-- Fixes four things that were exploitable in production:
--   1. Every RLS policy was `FOR ALL USING (auth.role() = 'authenticated')`.
--      auth.role() is 'authenticated' for ANY confirmed user of the Supabase
--      project, not for the shop owner — and email signup is open. Anyone could
--      register and read the whole customer/order database, or rewrite product
--      prices. Replaced with an explicit admin allowlist.
--   2. Anonymous review INSERT had `WITH CHECK (true)`, so anon could publish a
--      review with approved = true. Review text is rendered into JSON-LD, which
--      made it a stored-XSS sink. Anon may now only insert unapproved rows and
--      cannot touch the approved/source columns at all.
--   3. orders.payment_type was written and read by the app but existed in no
--      migration (added by hand in the dashboard) — a DB built from this folder
--      rejected every order.
--   4. There was no record of what LiqPay actually captured, only what we
--      expected (orders.total), so an underpayment was undetectable forever.

-- ---------------------------------------------------------------------------
-- 1. Admin allowlist
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.admins (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No policies: only the service role reaches this table directly. is_admin()
-- is SECURITY DEFINER so policies can consult it without recursing into RLS.
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid());
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- Seeded by explicit email, not by "oldest account" — on this project the oldest
-- account is the developer's, and seeding by age would have locked the shop
-- owner out of her own admin panel.
--
-- Anyone NOT in this table loses all admin access, including the panel. To add
-- someone later, run the same INSERT with their address.
INSERT INTO public.admins (user_id, email)
SELECT id, email FROM auth.users
WHERE email IN (
  'violaadmin@viola.com',   -- Viola — shop owner
  'amacyuk2@gmail.com'      -- developer
)
ON CONFLICT (user_id) DO NOTHING;

-- !! VERIFY AFTER RUNNING — expect both rows !!
--   select a.email from public.admins a;

-- ---------------------------------------------------------------------------
-- 2. Replace the blanket "any authenticated user" policies
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "products_authenticated_all" ON public.products;
DROP POLICY IF EXISTS "orders_authenticated"       ON public.orders;
DROP POLICY IF EXISTS "customers_authenticated"    ON public.customers;
DROP POLICY IF EXISTS "order_items_authenticated"  ON public.order_items;
DROP POLICY IF EXISTS "blog_posts_authenticated"   ON public.blog_posts;
DROP POLICY IF EXISTS "reviews_authenticated"      ON public.reviews;
DROP POLICY IF EXISTS "abandoned_checkouts_select_authenticated" ON public.abandoned_checkouts;

-- Public read stays as-is for the storefront (products/categories: USING (true),
-- blog_posts: published only, reviews: approved only — all defined in 001/002).

-- Dropped first so the migration is re-runnable: CREATE POLICY has no
-- IF NOT EXISTS, and this has to be safe to apply to a database that already
-- received part of it.
DROP POLICY IF EXISTS "products_admin_write"            ON public.products;
DROP POLICY IF EXISTS "categories_admin_write"          ON public.categories;
DROP POLICY IF EXISTS "orders_admin_all"                ON public.orders;
DROP POLICY IF EXISTS "customers_admin_all"             ON public.customers;
DROP POLICY IF EXISTS "order_items_admin_all"           ON public.order_items;
DROP POLICY IF EXISTS "blog_posts_admin_all"            ON public.blog_posts;
DROP POLICY IF EXISTS "reviews_admin_all"               ON public.reviews;
DROP POLICY IF EXISTS "abandoned_checkouts_admin_all"   ON public.abandoned_checkouts;

CREATE POLICY "products_admin_write" ON public.products
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "categories_admin_write" ON public.categories
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "orders_admin_all" ON public.orders
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "customers_admin_all" ON public.customers
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "order_items_admin_all" ON public.order_items
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "blog_posts_admin_all" ON public.blog_posts
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "reviews_admin_all" ON public.reviews
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "abandoned_checkouts_admin_all" ON public.abandoned_checkouts
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Anonymous review submission: unapproved only, and no privileged columns
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Anyone can insert review" ON public.reviews;
DROP POLICY IF EXISTS "anon_insert_unapproved_review" ON public.reviews;

CREATE POLICY "anon_insert_unapproved_review"
  ON public.reviews FOR INSERT
  TO anon
  WITH CHECK (
    approved = false
    AND source = 'internal'
    AND source_url IS NULL
    AND char_length(text) <= 2000
    AND char_length(author_name) <= 100
  );

-- Column-level backstop: even if the policy above is ever loosened, anon
-- physically cannot write approved/source/source_url.
REVOKE INSERT ON public.reviews FROM anon;
GRANT INSERT (author_name, rating, text, product_id) ON public.reviews TO anon;

-- ---------------------------------------------------------------------------
-- 4. orders.payment_type — present in the live DB, missing from migrations
-- ---------------------------------------------------------------------------

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_type TEXT;

-- Locale the order was placed in, so the payment page, the return URL and the
-- confirmation email match the language the customer was shopping in.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'uk';

-- Evidence that the buyer accepted the public offer before paying — required
-- for a distance-selling contract and for defending a chargeback.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS offer_accepted_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- 5. Payment audit trail
-- ---------------------------------------------------------------------------

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS paid_amount   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS paid_currency TEXT,
  ADD COLUMN IF NOT EXISTS paid_at       TIMESTAMPTZ;

-- Every LiqPay message we accept is recorded here before orders is touched, so
-- a short payment or a replayed callback is reconstructable after the fact.
CREATE TABLE IF NOT EXISTS public.payment_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID,
  source      TEXT NOT NULL,            -- 'callback' | 'reconcile'
  status      TEXT,                     -- LiqPay status verbatim
  amount      NUMERIC(10,2),
  currency    TEXT,
  accepted    BOOLEAN NOT NULL,         -- did we act on it
  reason      TEXT,                     -- why not, when accepted = false
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_order
  ON public.payment_events (order_id, created_at DESC);

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_events_admin_read" ON public.payment_events;

CREATE POLICY "payment_events_admin_read" ON public.payment_events
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- 6. Server-side stock guard support
-- ---------------------------------------------------------------------------

-- Lets the order API tell "sold out" from "never existed" in one query.
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products (in_stock);
