-- Allow product videos to use the product-media storage bucket.
-- The Supabase project may impose a separate upload-size cap.
UPDATE storage.buckets
SET file_size_limit = GREATEST(COALESCE(file_size_limit, 0), 52428800)
WHERE id = 'product-images';
