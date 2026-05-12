-- Migration 005: Add "Пілінг-шампуні" category
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

INSERT INTO public.categories (name, slug, name_en) VALUES
  ('Пілінг-шампуні', 'peeling-shampoos', 'Peeling Shampoos')
ON CONFLICT (slug) DO NOTHING;
