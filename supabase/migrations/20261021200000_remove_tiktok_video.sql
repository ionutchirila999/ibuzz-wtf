-- TikTok is no longer supported anywhere in the marketplace.
-- Remove the product-level video field and its stored links.
ALTER TABLE public.products DROP COLUMN IF EXISTS video_url;
