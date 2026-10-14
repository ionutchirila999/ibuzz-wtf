DROP POLICY IF EXISTS "admin read product images" ON storage.objects;
CREATE POLICY "admin read product images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "admin update product images" ON storage.objects;
CREATE POLICY "admin update product images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin')) WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));