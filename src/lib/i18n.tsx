import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "th" | "en" | "ro";
export const LANGS: { code: Lang; label: string }[] = [
  { code: "th", label: "ไทย" },
  { code: "en", label: "EN" },
  { code: "ro", label: "RO" },
];
export const DEFAULT_LANG: Lang = "th";

// [Thai, English, Romanian]
const D = {
  "nav.shop": ["ร้านค้า", "Shop", "Magazin"],
  "nav.sell": ["ขายให้เรา", "Sell to us", "Vinde-ne"],
  "nav.owner": ["เจ้าของร้าน", "Owner", "Proprietar"],
  tagline: ["ซ่อม ตรวจสอบ และขายต่ออย่างใส่ใจ", "Repaired, inspected and resold with care", "Reparate, verificate și revândute cu grijă"],
  "home.kicker": ["ซื้อ · ซ่อม · ขายต่อ", "BUY · REPAIR · RESELL", "CUMPĂRĂM · REPARĂM · REVINDEM"],
  "home.title": ["ซื้ออย่างคุ้มค่า ซ่อมอย่างมืออาชีพ ขายต่ออย่างมั่นใจ", "Buy Smart. Repair Better. Resell with Confidence.", "Cumpără inteligent. Repară mai bine. Revinde cu încredere."],
  "home.lead": [
    "เรารับซื้ออุปกรณ์อิเล็กทรอนิกส์มือสอง ซ่อมและทดสอบโดยช่างมืออาชีพ แล้วนำเทคโนโลยีคุณภาพกลับมาขายในราคาคุ้มค่า พร้อมรองเท้าผู้หญิงทั้งใหม่และมือสองที่คัดสรรอย่างใส่ใจ",
    "We buy pre-owned electronics, professionally repair and test devices, and resell quality technology at great value. We also offer a curated collection of new and pre-owned women’s shoes.",
    "Cumpărăm electronice second-hand, reparăm și testăm profesional dispozitivele și revindem tehnologie de calitate la prețuri avantajoase. Oferim și o colecție atent selecționată de pantofi de damă noi și second-hand.",
  ],
  "home.exploreTech": ["เลือกซื้อเทคโนโลยี", "Shop Technology", "Cumpără tehnologie"],
  "home.shopShoes": ["เลือกซื้อรองเท้าผู้หญิง", "Shop Women's Shoes", "Cumpără pantofi de damă"],
  "home.sellDevice": ["ขายอุปกรณ์ของคุณให้เรา", "Sell Your Device", "Vinde-ne dispozitivul tău"],
  "home.f1t": ["ซื้อ", "BUY", "CUMPĂRĂM"],
  "home.f1d": ["เรารับซื้ออุปกรณ์อิเล็กทรอนิกส์มือสอง", "We purchase pre-owned electronics.", "Cumpărăm electronice second-hand."],
  "home.f2t": ["ซ่อม", "REPAIR", "REPARĂM"],
  "home.f2d": ["เราวิเคราะห์ปัญหา ซ่อมแซม และทดสอบอุปกรณ์", "We diagnose, repair, and test devices.", "Diagnosticăm, reparăm și testăm dispozitivele."],
  "home.f3t": ["ขายต่อ", "RESELL", "REVINDEM"],
  "home.f3d": ["เราจำหน่ายเทคโนโลยีที่ผ่านการตรวจสอบและซ่อมแซมในราคาที่แข่งขันได้", "We offer inspected, repaired technology at competitive prices.", "Oferim tehnologie verificată și reparată la prețuri competitive."],
  "home.ctaT": ["มีของจะขายไหม?", "Have something to sell?", "Ai ceva de vândut?"],
  "home.ctaD": ["โทรศัพท์ แล็ปท็อป แท็บเล็ต ทีวี อุปกรณ์เกมมิ่ง หรือสกูตเตอร์ไฟฟ้ามือสอง — ส่งรายละเอียดมาให้เรา สมาร์ตโฟนและกล้องดิจิทัลที่เสียก็ขายได้", "Used phones, laptops, tablets, TVs, gaming devices or electric scooters — send us an offer. Broken smartphones and digital cameras are welcome too.", "Telefoane, laptopuri, tablete, televizoare, dispozitive de gaming sau trotinete electrice second-hand — trimite-ne o ofertă. Acceptăm și smartphone-uri și aparate foto digitale defecte."],
  "home.ctaB": ["เสนอขายสินค้า", "Offer an item", "Oferă un produs"],
  "cat.technology": ["เทคโนโลยี", "Technology", "Tehnologie"],
  "cat.womens_shoes": ["รองเท้าผู้หญิง", "Women's Shoes", "Pantofi de damă"],
  "cond.new": ["ใหม่", "New", "Nou"],
  "cond.pre_owned": ["มือสอง", "Pre-owned", "Second-hand"],
  "cond.refurbished": ["รีเฟอร์บิช", "Refurbished", "Recondiționat"],
  "shop.all": ["ทั้งหมด", "All", "Toate"],
  "shop.search": ["ค้นหายี่ห้อ รุ่น…", "Search brand, model…", "Caută marcă, model…"],
  "shop.type": ["ประเภท", "Type", "Tip"],
  "shop.allTypes": ["ทุกประเภท", "All types", "Toate tipurile"],
  "shop.condition": ["สภาพ", "Condition", "Stare"],
  "shop.anyCond": ["ทุกสภาพ", "Any condition", "Orice stare"],
  "shop.newest": ["ใหม่ล่าสุด", "Newest", "Cele mai noi"],
  "shop.priceAsc": ["ราคา: ต่ำไปสูง", "Price: low to high", "Preț: crescător"],
  "shop.priceDesc": ["ราคา: สูงไปต่ำ", "Price: high to low", "Preț: descrescător"],
  "shop.size": ["ไซซ์ เช่น 38", "Size e.g. 38", "Mărime ex. 38"],
  "shop.empty": ["ยังไม่มีสินค้าในหมวดนี้ แวะมาใหม่หรือทักหาเราได้เลย", "No items listed here yet. Check back soon or message us.", "Încă nu sunt produse aici. Revino curând sau scrie-ne."],
  loading: ["กำลังโหลด…", "Loading…", "Se încarcă…"],
  "card.demo": ["สินค้าตัวอย่าง", "Demo listing", "Anunț demonstrativ"],
  "card.sold": ["ขายแล้ว", "Sold", "Vândut"],
  "card.neg": ["ต่อรองได้", "negotiable", "negociabil"],
  "p.notFound": ["ไม่พบสินค้า", "Item not found.", "Produs negăsit."],
  "p.back": ["กลับไปร้านค้า", "Back to shop", "Înapoi la magazin"],
  "p.demo": ["รายการสาธิต — ไม่ใช่สินค้าจริง", "Demonstration listing — not real stock", "Anunț demonstrativ — nu este stoc real"],
  "p.neg": ["· ราคาต่อรองได้", "· price negotiable", "· preț negociabil"],
  "p.category": ["หมวดหมู่", "Category", "Categorie"],
  "p.brand": ["ยี่ห้อ", "Brand", "Marcă"],
  "p.model": ["รุ่น", "Model", "Model"],
  "p.size": ["ไซซ์", "Size", "Mărime"],
  "p.color": ["สี", "Color", "Culoare"],
  "p.material": ["วัสดุ", "Material", "Material"],
  "p.avail": ["สถานะสินค้า", "Availability", "Disponibilitate"],
  "p.soldOut": ["ขายหมดแล้ว", "Sold out", "Stoc epuizat"],
  "p.inStock": ["ชิ้นในสต็อก", "in stock", "în stoc"],
  "p.auth": ["ยืนยันของแท้แล้ว", "Authenticity verified", "Autenticitate verificată"],
  "sell.title": ["ขายสินค้าของคุณให้เรา", "Sell your item to us", "Vinde-ne produsul tău"],
  "sell.lead": ["เรารับซื้อโทรศัพท์ แล็ปท็อป แท็บเล็ต ทีวี อุปกรณ์เกมมิ่ง สกูตเตอร์ไฟฟ้า กล้องดิจิทัลมือสอง และรองเท้าผู้หญิง — สมาร์ตโฟนและกล้องที่เสียก็ขายได้", "We buy used phones, laptops, tablets, TVs, gaming devices, electric scooters, digital cameras and women's footwear. Broken smartphones and cameras are welcome — faulty is fine.", "Cumpărăm telefoane, laptopuri, tablete, televizoare, dispozitive de gaming, trotinete electrice, aparate foto digitale second-hand și încălțăminte de damă. Acceptăm și smartphone-uri și aparate foto defecte."],
  "sell.elec": ["อิเล็กทรอนิกส์", "Electronics", "Electronice"],
  "sell.shoes": ["รองเท้าผู้หญิง", "Women's shoes", "Pantofi de damă"],
  "sell.name": ["ชื่อของคุณ", "Your name", "Numele tău"],
  "sell.contact": ["เบอร์โทร, WhatsApp หรือ LINE ID", "Phone, WhatsApp or LINE ID", "Telefon, WhatsApp sau ID LINE"],
  "sell.item": ["คุณจะขายอะไร?", "What are you selling?", "Ce vinzi?"],
  "sell.phTech": ["เช่น iPhone 13 128GB จอแตก หรือ DSLR ชัตเตอร์เสีย", "e.g. iPhone 13 128GB, cracked screen, or a DSLR with a broken shutter", "ex. iPhone 13 128GB, ecran spart, sau un DSLR cu obturatorul defect"],
  "sell.phShoes": ["เช่น Nike Air Max ผู้หญิง EU 38 ใส่สองครั้ง", "e.g. Nike Air Max women's EU 38, worn twice", "ex. Nike Air Max damă EU 38, purtați de două ori"],
  "sell.cond": ["สภาพ / ปัญหาที่ทราบ", "Condition / known faults", "Stare / defecte cunoscute"],
  "sell.price": ["ราคาที่ต้องการ (฿, ไม่บังคับ)", "Asking price (฿, optional)", "Preț cerut (฿, opțional)"],
  "sell.send": ["ส่งข้อเสนอ", "Send offer", "Trimite oferta"],
  "sell.sending": ["กำลังส่ง…", "Sending…", "Se trimite…"],
  "sell.missing": ["กรุณากรอกชื่อ ช่องทางติดต่อ และสินค้า", "Please fill in name, contact and item.", "Completează numele, contactul și produsul."],
  "sell.err": ["ส่งไม่สำเร็จ กรุณาลองใหม่", "Couldn't send. Please try again.", "Nu s-a putut trimite. Încearcă din nou."],
  "sell.doneT": ["ได้รับข้อเสนอแล้ว", "Offer received", "Ofertă primită"],
  "sell.doneD": ["เราจะตรวจสอบและติดต่อกลับเร็วๆ นี้", "We'll review it and contact you soon.", "O vom analiza și te vom contacta curând."],
  "wa.product": ["สวัสดีค่ะ สนใจสินค้า:", "Hi, I'm interested in:", "Bună, sunt interesat(ă) de:"],
  "wa.general": ["สวัสดีค่ะ มีคำถามค่ะ", "Hi, I have a question", "Bună, am o întrebare"],
} satisfies Record<string, [string, string, string]>;

export type TKey = keyof typeof D;

const SUB: Record<string, [string, string]> = {
  "Smartphones & mobile phones": ["สมาร์ทโฟนและมือถือ", "Smartphone-uri și telefoane"],
  "Digital cameras & lenses": ["กล้องถ่ายรูปและเลนส์", "Aparate foto și obiective"],
  "Tablets & laptops": ["แท็บเล็ตและแล็ปท็อป", "Tablete și laptopuri"],
  "TVs & monitors": ["ทีวีและจอมอนิเตอร์", "Televizoare și monitoare"],
  "Computer components & accessories": ["อุปกรณ์และชิ้นส่วนคอมพิวเตอร์", "Componente și accesorii PC"],
  "Gaming equipment & peripherals": ["อุปกรณ์เกมมิ่ง", "Echipamente de gaming"],
  "E-scooter parts & accessories": ["อะไหล่และอุปกรณ์สกูตเตอร์ไฟฟ้า", "Piese și accesorii trotinete electrice"],
  "Used & refurbished electronics": ["อิเล็กทรอนิกส์มือสองและรีเฟอร์บิช", "Electronice second-hand și recondiționate"],
  "Repair parts & technical accessories": ["อะไหล่ซ่อมและอุปกรณ์เทคนิค", "Piese de reparații și accesorii tehnice"],
  "Women's sneakers": ["รองเท้าผ้าใบผู้หญิง", "Sneakers de damă"],
  "Women's casual shoes": ["รองเท้าลำลองผู้หญิง", "Pantofi casual de damă"],
  "Women's sports & running shoes": ["รองเท้ากีฬาและวิ่งผู้หญิง", "Pantofi sport și de alergare damă"],
  "Women's sandals & slippers": ["รองเท้าแตะผู้หญิง", "Sandale și papuci de damă"],
  "Women's heels & dress shoes": ["รองเท้าส้นสูงผู้หญิง", "Pantofi cu toc și eleganți damă"],
  "Women's boots": ["รองเท้าบูทผู้หญิง", "Cizme de damă"],
  "Collectible women's footwear": ["รองเท้าผู้หญิงสะสม", "Încălțăminte de damă de colecție"],
};

const idx: Record<Lang, number> = { th: 0, en: 1, ro: 2 };

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: TKey) => string; sub: (s: string) => string };
const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);
  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "th" || saved === "en" || saved === "ro") setLangState(saved);
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const setLang = (l: Lang) => { setLangState(l); localStorage.setItem("lang", l); };
  const t = (k: TKey) => D[k][idx[lang]] ?? D[k][1];
  const sub = (s: string) => (lang === "en" ? s : (SUB[s]?.[lang === "th" ? 0 : 1] ?? s));
  return <I18nCtx.Provider value={{ lang, setLang, t, sub }}>{children}</I18nCtx.Provider>;
}

export function useT() {
  const c = useContext(I18nCtx);
  if (!c) throw new Error("useT must be inside I18nProvider");
  return c;
}

export function translate(lang: Lang, k: TKey) { return D[k][idx[lang]]; }
