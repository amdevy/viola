-- Abandoned checkouts: capture cart + contact once a shopper enters a valid
-- phone on the checkout form but has not yet placed the order. For now this is
-- capture-only (measure how many people abandon); outreach/recovery is added
-- later. One row per phone — re-entering the form updates the same row.
--
-- status  — 'pending' (started checkout, no order yet)
--           'ordered' (the same phone completed an order — excluded from recovery)

CREATE TABLE IF NOT EXISTS public.abandoned_checkouts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT UNIQUE NOT NULL,
  name        TEXT,
  email       TEXT,
  items       JSONB NOT NULL DEFAULT '[]'::jsonb,
  item_count  INTEGER NOT NULL DEFAULT 0,
  total       NUMERIC NOT NULL DEFAULT 0,
  city        TEXT,
  np_address  TEXT,
  status      TEXT NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recovery job will scan by (status, created_at); admin views by recency.
CREATE INDEX IF NOT EXISTS idx_abandoned_status_created
  ON public.abandoned_checkouts (status, created_at DESC);

-- Holds customer PII (phone/email). Enable RLS: writes happen only via the
-- service-role key (used by /api/abandoned-checkout, which bypasses RLS), so
-- there is no public INSERT/UPDATE policy. Authenticated admins may read it in
-- the admin panel — same posture as the orders/customers tables.
ALTER TABLE public.abandoned_checkouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "abandoned_checkouts_select_authenticated"
  ON public.abandoned_checkouts FOR SELECT
  TO authenticated USING (true);
