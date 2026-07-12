-- Likes counter for social proof on products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_likes_count
  ON public.products (likes_count DESC);

-- Atomic increment helper used by /api/products/like
CREATE OR REPLACE FUNCTION public.bump_product_likes(p_id UUID, p_delta INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new INTEGER;
BEGIN
  IF p_delta NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'delta_out_of_range';
  END IF;

  UPDATE public.products
  SET likes_count = GREATEST(0, likes_count + p_delta)
  WHERE id = p_id
  RETURNING likes_count INTO v_new;

  RETURN COALESCE(v_new, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.bump_product_likes(UUID, INTEGER) TO anon, authenticated, service_role;
