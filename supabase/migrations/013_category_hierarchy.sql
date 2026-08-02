-- ---------------------------------------------------------------------------
-- Category hierarchy + the Na WKIR[y] skin-care line
-- ---------------------------------------------------------------------------
--
-- Why two levels rather than one flat "Догляд за шкірою" bucket:
--
-- Google serves *category* pages for plural commercial queries ("купити скраб
-- для тіла", "гель для душу"). One merged bucket gives one page competing for
-- "догляд за шкірою" — a broad term owned by Rozetka/Eva/Watsons that this shop
-- will never win. Five focused pages compete for terms it can actually win.
--
-- The hierarchy exists for breadcrumbs and internal linking, NOT for URLs:
-- category pages stay at /shop/category/<slug> with no nesting. URL depth buys
-- nothing in ranking, and flattening keeps every already-indexed URL intact.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Schema
-- ---------------------------------------------------------------------------

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- Menu order lived in a hardcoded map in lib/categories.ts, which meant adding a
-- category required a deploy. One source of truth, editable by the shop.
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 99;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS name_en TEXT;

CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories (parent_id);

-- A category cannot be its own parent. Only one level is used in the UI, but
-- this at least stops the trivial cycle.
ALTER TABLE public.categories
  DROP CONSTRAINT IF EXISTS categories_parent_not_self;
ALTER TABLE public.categories
  ADD CONSTRAINT categories_parent_not_self CHECK (parent_id IS NULL OR parent_id <> id);

-- ---------------------------------------------------------------------------
-- 2. Preserve the existing menu order that was hardcoded in the app
-- ---------------------------------------------------------------------------

UPDATE public.categories SET sort_order = 1  WHERE slug = 'shampoos';
UPDATE public.categories SET sort_order = 2  WHERE slug = 'peeling-shampoos';
UPDATE public.categories SET sort_order = 3  WHERE slug = 'conditioners';
UPDATE public.categories SET sort_order = 4  WHERE slug = 'masks';
UPDATE public.categories SET sort_order = 5  WHERE slug = 'leave-in';
UPDATE public.categories SET sort_order = 6  WHERE slug = 'styling-brushes';
UPDATE public.categories SET sort_order = 7  WHERE slug = 'additions';
UPDATE public.categories SET sort_order = 8  WHERE slug = 'gift-sets';

-- ---------------------------------------------------------------------------
-- 3. The skin-care line
-- ---------------------------------------------------------------------------
--
-- Seeded empty on purpose. Categories with no products are hidden everywhere
-- (see lib/categories.ts), so these stay invisible until Viola adds the first
-- product to each — no deploy needed to launch a section.
--
-- Named for what people search ("Догляд за шкірою"), not for the brand
-- stylisation (Na WKIR[y]) — the brand name belongs in the H1 subtitle and
-- description, where it reinforces without costing the head term.

INSERT INTO public.categories (name, name_en, slug, sort_order)
VALUES ('Догляд за шкірою', 'Skin Care', 'skin-care', 20)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO public.categories (name, name_en, slug, sort_order, parent_id)
SELECT v.name, v.name_en, v.slug, v.sort_order, parent.id
FROM (
  VALUES
    ('Гелі для душу',      'Shower Gels', 'shower-gels', 21),
    ('Скраби для тіла',    'Body Scrubs', 'body-scrubs', 22),
    ('Креми для рук',      'Hand Creams', 'hand-creams', 23),
    ('Догляд за обличчям', 'Face Care',   'face-care',   24),
    ('Інше для тіла',      'Body Care',   'body-other',  25)
) AS v(name, name_en, slug, sort_order)
CROSS JOIN (SELECT id FROM public.categories WHERE slug = 'skin-care') AS parent
ON CONFLICT (slug) DO UPDATE
  SET name       = EXCLUDED.name,
      name_en    = EXCLUDED.name_en,
      sort_order = EXCLUDED.sort_order,
      parent_id  = EXCLUDED.parent_id;
