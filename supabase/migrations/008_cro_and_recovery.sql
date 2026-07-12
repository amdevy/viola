-- CRO migration
-- Adds: bestseller flag, benefits bullets (UA/EN) shown on the product page.

-- 1. Products: is_bestseller flag (for homepage and sort=popular)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_bestseller
  ON public.products (is_bestseller)
  WHERE is_bestseller = true;

-- 2. Products: benefits bullets (short value-prop points shown on product page)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS benefits TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS benefits_en TEXT[] NOT NULL DEFAULT '{}';

-- 3. Seed: mark first 6 products as bestsellers (so homepage isn't empty)
-- Owner can override via /admin.
UPDATE public.products
SET is_bestseller = true
WHERE id IN (
  SELECT id FROM public.products
  WHERE in_stock = true AND is_coming_soon = false
  ORDER BY created_at DESC
  LIMIT 6
);
