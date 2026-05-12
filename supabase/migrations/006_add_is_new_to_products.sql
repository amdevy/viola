-- Add is_new flag to products for "Новинка" badge
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false;
