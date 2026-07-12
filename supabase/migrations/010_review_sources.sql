-- Reviews: track where each review came from so we can display Google
-- Business Profile reviews alongside internally-submitted ones.
--
-- source        — 'internal' (submitted via site form) or 'google'
--                 (copied from the Google Business Profile). Other
--                 platforms (Instagram, TripAdvisor, etc.) can reuse
--                 this field with their own tag.
-- source_url    — deep link back to the original review; required for
--                 Google TOS attribution when source = 'google'.

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'internal';

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS source_url TEXT;

CREATE INDEX IF NOT EXISTS idx_reviews_source ON public.reviews (source);
