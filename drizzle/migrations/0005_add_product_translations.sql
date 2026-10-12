ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS title_th TEXT,
  ADD COLUMN IF NOT EXISTS title_ro TEXT,
  ADD COLUMN IF NOT EXISTS description_th TEXT,
  ADD COLUMN IF NOT EXISTS description_ro TEXT;

COMMENT ON COLUMN public.products.title_th IS 'Thai product title; falls back to title when NULL';
COMMENT ON COLUMN public.products.title_ro IS 'Romanian product title; falls back to title when NULL';
COMMENT ON COLUMN public.products.description_th IS 'Thai product description; falls back to description when NULL';
COMMENT ON COLUMN public.products.description_ro IS 'Romanian product description; falls back to description when NULL';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;
GRANT ALL ON public.products TO service_role;