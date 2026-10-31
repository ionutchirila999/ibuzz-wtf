begin;

-- Publish the seller-confirmed adidas KE0703 listing.
-- The seller supplied real-item photos and label close-ups confirming article code KE0703.
-- Keep authenticity unverified; the article label alone is not an independent authenticity check.
update public.products
set
  title = 'adidas Originals Lightweight Regular Shorts – KE0703',
  title_th = 'กางเกงขาสั้น adidas Originals Lightweight Regular รุ่น KE0703',
  title_ro = 'Pantaloni scurți adidas Originals Lightweight Regular – KE0703',
  description = 'Black adidas Originals Lightweight Regular Shorts, article code KE0703, size XS. Elastic waist, subtle side stripe detailing and small adidas logo. The listing image is the official adidas product reference; seller-provided label photos confirm the article code.',
  description_th = 'กางเกงขาสั้น adidas Originals Lightweight Regular สีดำ รุ่น KE0703 ไซซ์ XS เอวยางยืด มีแถบลายด้านข้างและโลโก้ adidas ขนาดเล็ก ภาพสินค้าเป็นภาพอ้างอิงอย่างเป็นทางการจาก adidas และภาพป้ายจากผู้ขายยืนยันรหัสรุ่น',
  description_ro = 'Pantaloni scurți adidas Originals Lightweight Regular negri, cod KE0703, mărimea XS. Talie elastică, detalii discrete cu dungi laterale și logo adidas mic. Imaginea listării este fotografia oficială de referință adidas; fotografiile etichetei furnizate de vânzător confirmă codul articolului.',
  images = array['https://assets.adidas.com/images/w_500%2Cf_auto%2Cq_auto/0ed64d4f57bf4494a903cd48a91482a7_9366/LIGHTWEIGHT_REGULAR_SHORTS_Black_KE0703_21_model.jpg'],
  price = 555,
  stock = 1,
  status = 'available',
  authenticity_verified = false,
  authenticity_notes = 'Seller supplied photos show article label KE0703. Authenticity has not been independently verified.',
  updated_at = now()
where lower(coalesce(brand, '')) = 'adidas'
  and upper(coalesce(model, '')) = 'KE0703';

commit;
