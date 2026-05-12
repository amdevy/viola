-- Add is_coming_soon flag to products for "Очікується" badge
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_coming_soon BOOLEAN DEFAULT false;
