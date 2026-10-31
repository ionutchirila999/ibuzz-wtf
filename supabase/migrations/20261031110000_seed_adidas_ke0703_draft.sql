begin;

-- Seed the adidas KE0703 item as a hidden draft.
-- The single image is the public adidas product reference image; it is not a photo
-- of the seller's individual pair. Keep the listing hidden until its condition,
-- selling price, and actual-item photos have been confirmed.
insert into public.products (
  category,
  market_category,
  market_condition,
  subcategory,
  audience,
  title,
  title_th,
  title_ro,
  brand,
  model,
  description,
  description_th,
  description_ro,
  images,
  price,
  negotiable,
  stock,
  condition,
  shoe_size,
  size_system,
  color,
  material,
  authenticity_verified,
  authenticity_notes,
  is_demo,
  status,
  translation_status_th,
  translation_status_ro,
  is_featured,
  low_stock_threshold
)
select
  'technology',
  'clothing',
  'pre_owned',
  'Trousers & shorts',
  'men',
  'adidas Originals Lightweight Regular Shorts – KE0703',
  'กางเกงขาสั้น adidas Originals Lightweight Regular รุ่น KE0703',
  'Pantaloni scurți adidas Originals Lightweight Regular – KE0703',
  'adidas',
  'KE0703',
  'Black adidas Originals lightweight regular-fit shorts, article code KE0703, size XS. Drawcord waist, 7-inch inseam and recycled polyester fabric. The current image is an official adidas reference photo, not a photograph of the individual item. Actual-item photos, condition and final selling price must be confirmed before publication.',
  'กางเกงขาสั้น adidas Originals สีดำ รุ่น KE0703 ไซซ์ XS ทรง Regular พร้อมเชือกผูกเอว ความยาวตะเข็บด้านใน 7 นิ้ว และผลิตจากโพลีเอสเตอร์รีไซเคิล รูปภาพปัจจุบันเป็นภาพอ้างอิงจาก adidas อย่างเป็นทางการ ไม่ใช่ภาพถ่ายสินค้าชิ้นจริง ต้องยืนยันสภาพสินค้า ราคา และเพิ่มภาพถ่ายสินค้าจริงก่อนเผยแพร่',
  'Pantaloni scurți adidas Originals negri, model KE0703, mărimea XS, croială regular, cu șnur în talie și lungime interioară a cracului de 7 inch. Material din poliester reciclat. Imaginea actuală este o fotografie oficială de referință adidas, nu fotografia exemplarului vândut. Starea, prețul final și fotografiile articolului real trebuie confirmate înainte de publicare.',
  array['https://assets.adidas.com/images/w_500%2Cf_auto%2Cq_auto/0ed64d4f57bf4494a903cd48a91482a7_9366/LIGHTWEIGHT_REGULAR_SHORTS_Black_KE0703_21_model.jpg'],
  0,
  false,
  0,
  'pre_owned',
  'XS',
  'UK',
  'Black',
  '100% recycled polyester',
  false,
  'Article label shows KE0703. Authenticity has not been independently verified.',
  false,
  'hidden',
  'needs_review',
  'needs_review',
  false,
  2
where not exists (
  select 1
  from public.products
  where lower(coalesce(brand, '')) = 'adidas'
    and upper(coalesce(model, '')) = 'KE0703'
);

commit;
