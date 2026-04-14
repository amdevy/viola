-- Migration 003: Add English translation columns for i18n support
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- All columns are nullable — if empty, EN pages will fall back to UK content
-- and be marked as noindex to protect SEO.

-- Products: name, description, ingredients, how_to_use
ALTER TABLE products ADD COLUMN IF NOT EXISTS name_en text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_en text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients_en text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS how_to_use_en text;

-- Blog posts: title, excerpt, content
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS title_en text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt_en text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_en text;

-- Categories: name
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_en text;
