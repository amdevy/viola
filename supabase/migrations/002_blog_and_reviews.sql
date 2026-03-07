-- Add missing anon-access policies for blog_posts and reviews
-- (Tables already created in 001_initial_schema.sql)

-- Allow anonymous users to read published blog posts
DROP POLICY IF EXISTS "Public read published posts" ON public.blog_posts;
CREATE POLICY "Public read published posts"
  ON public.blog_posts FOR SELECT
  TO anon
  USING (published = true);

-- Allow anonymous users to read approved reviews
DROP POLICY IF EXISTS "Public read approved reviews" ON public.reviews;
CREATE POLICY "Public read approved reviews"
  ON public.reviews FOR SELECT
  TO anon
  USING (approved = true);

-- Allow anonymous users to submit reviews (saved as unapproved)
DROP POLICY IF EXISTS "Anyone can insert review" ON public.reviews;
CREATE POLICY "Anyone can insert review"
  ON public.reviews FOR INSERT
  TO anon
  WITH CHECK (true);
