-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  ingredients TEXT,
  how_to_use TEXT,
  price NUMERIC(10,2) NOT NULL,
  compare_price NUMERIC(10,2),
  images TEXT[] DEFAULT '{}',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  in_stock BOOLEAN DEFAULT true,
  volume TEXT,
  hair_type TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Customers
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  city TEXT NOT NULL,
  nova_poshta_ref TEXT NOT NULL,
  nova_poshta_address TEXT NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  payment_id TEXT,
  payment_status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Order items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(10,2) NOT NULL
);

-- Blog posts
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  cover_image TEXT,
  content TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  reading_time INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- RLS: products public read
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (true);

-- RLS: categories public read
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (true);

-- RLS: authenticated users can manage products
CREATE POLICY "products_authenticated_all" ON public.products FOR ALL USING (auth.role() = 'authenticated');

-- RLS: admin for orders, customers, etc.
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_authenticated" ON public.orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "customers_authenticated" ON public.customers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "order_items_authenticated" ON public.order_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "blog_posts_authenticated" ON public.blog_posts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "reviews_authenticated" ON public.reviews FOR ALL USING (auth.role() = 'authenticated');

-- Service role bypass: API uses service role for orders/customers
-- Allow anon for insert (checkout) - orders API uses service role
-- Service role bypasses RLS by default

-- Storage bucket "products":
-- 1. Supabase Dashboard → Storage → New bucket → name: "products", Public: ON
-- 2. Bucket → Policies → New policy:
--    - For INSERT: "Allow authenticated uploads" - (auth.role() = 'authenticated')

-- Seed categories
INSERT INTO public.categories (name, slug) VALUES
  ('Шампуні', 'shampoos'),
  ('Кондиціонери', 'conditioners'),
  ('Маски', 'masks'),
  ('Незмивний догляд термозахист', 'leave-in'),
  ('Доповнення догляду', 'additions'),
  ('Подарункові набори', 'gift-sets')
ON CONFLICT (slug) DO NOTHING;
