begin;

-- Ensure the KE0703 listing exists and is publicly available even if the
-- earlier draft-seed migration was never applied. Safe to re-run by model code.
do $$
begin
update public.products
set
  title = 'adidas Originals Lightweight Regular Shorts – KE0703',
  title_th = 'กางเกงขาสั้น adidas Originals Lightweight Regular รุ่น KE0703',
  title_ro = 'Pantaloni scurți adidas Originals Lightweight Regular – KE0703',
  description = 'Black adidas Originals Lightweight Regular Shorts, article code KE0703, size XS. Seller-provided label photos confirm the article code. The listing image is an official adidas reference image, not a photograph of the individual item. Authenticity has not been independently verified.',
  description_th = 'กางเกงขาสั้น adidas Originals สีดำ รุ่น KE0703 ไซซ์ XS ภาพป้ายจากผู้ขายยืนยันรหัสรุ่น ภาพสินค้าหลักเป็นภาพอ้างอิงอย่างเป็นทางการจาก adidas ไม่ใช่ภาพถ่ายสินค้าชิ้นจริง และยังไม่ได้ตรวจสอบความแท้โดยอิสระ',
  description_ro = 'Pantaloni scurți adidas Originals negri, cod KE0703, mărimea XS. Fotografiile etichetei furnizate de vânzător confirmă codul articolului. Imaginea listării este o fotografie oficială adidas de referință, nu fotografia exemplarului vândut. Autenticitatea nu a fost verificată independent.',
  images = array['https://assets.adidas.com/images/w_500%2Cf_auto%2Cq_auto/0ed64d4f57bf4494a903cd48a91482a7_9366/LIGHTWEIGHT_REGULAR_SHORTS_Black_KE0703_21_model.jpg'],
  price = 555,
  stock = 1,
  status = 'available',
  authenticity_verified = false,
  authenticity_notes = 'Seller supplied label photos show article code KE0703; authenticity has not been independently verified.',
  updated_at = now()
where lower(coalesce(brand, '')) = 'adidas'
  and upper(coalesce(model, '')) = 'KE0703';

if not found then
  insert into public.products (
    category, market_category, market_condition, subcategory, audience,
    title, title_th, title_ro, brand, model,
    description, description_th, description_ro, images,
    price, negotiable, stock, condition, shoe_size, size_system,
    color, material, authenticity_verified, authenticity_notes,
    is_demo, status, translation_status_th, translation_status_ro,
    is_featured, low_stock_threshold
  ) values (
    'technology', 'clothing', 'pre_owned', 'Trousers & shorts', 'men',
    'adidas Originals Lightweight Regular Shorts – KE0703',
    'กางเกงขาสั้น adidas Originals Lightweight Regular รุ่น KE0703',
    'Pantaloni scurți adidas Originals Lightweight Regular – KE0703',
    'adidas', 'KE0703',
    'Black adidas Originals Lightweight Regular Shorts, article code KE0703, size XS. Seller-provided label photos confirm the article code. The listing image is an official adidas reference image, not a photograph of the individual item. Authenticity has not been independently verified.',
    'กางเกงขาสั้น adidas Originals สีดำ รุ่น KE0703 ไซซ์ XS ภาพป้ายจากผู้ขายยืนยันรหัสรุ่น ภาพสินค้าหลักเป็นภาพอ้างอิงอย่างเป็นทางการจาก adidas ไม่ใช่ภาพถ่ายสินค้าชิ้นจริง และยังไม่ได้ตรวจสอบความแท้โดยอิสระ',
    'Pantaloni scurți adidas Originals negri, cod KE0703, mărimea XS. Fotografiile etichetei furnizate de vânzător confirmă codul articolului. Imaginea listării este o fotografie oficială adidas de referință, nu fotografia exemplarului vândut. Autenticitatea nu a fost verificată independent.',
    array['https://assets.adidas.com/images/w_500%2Cf_auto%2Cq_auto/0ed64d4f57bf4494a903cd48a91482a7_9366/LIGHTWEIGHT_REGULAR_SHORTS_Black_KE0703_21_model.jpg'],
    555, false, 1, 'pre_owned', 'XS', 'UK',
    'Black', '100% recycled polyester', false,
    'Seller supplied label photos show article code KE0703; authenticity has not been independently verified.',
    false, 'available', 'needs_review', 'needs_review', false, 2
  );
end if;
end $$;

commit;
