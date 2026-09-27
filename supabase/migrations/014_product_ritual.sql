-- ---------------------------------------------------------------------------
-- Care ritual picked by hand
-- ---------------------------------------------------------------------------
--
-- The product page's "Створіть повний ритуал догляду" block offers one product
-- for each step of a routine (shampoo → conditioner → mask → leave-in), picked
-- automatically by line from the product names (lib/ritual.ts). This column
-- lets the admin replace that pick for a product; empty means automatic.
--
-- A plain uuid[] rather than a join table: at most three ids, always read with
-- the product row. A picked product that is deleted or out of stock is simply
-- skipped by the page.
--
-- Covered by the existing policies (public read, products_admin_write).
-- Safe to re-run.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS ritual_ids UUID[] NOT NULL DEFAULT '{}';

-- !! VERIFY AFTER RUNNING — expect the number of products !!
--   select count(*) from public.products where ritual_ids = '{}';
