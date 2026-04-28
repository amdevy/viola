-- Migration 004: Add "Styling Brushes" category
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

INSERT INTO public.categories (name, slug, name_en) VALUES
  ('Браші для укладки волосся', 'styling-brushes', 'Styling Brushes')
ON CONFLICT (slug) DO NOTHING;
