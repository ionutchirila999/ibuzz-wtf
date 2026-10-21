import type { Lang } from "@/lib/i18n";

// Link-preview text per language. Thai is the default when a link has no ?lang=.
export const shareLang = (v: unknown): Lang => (v === "en" || v === "ro" ? v : "th");

type Cat = "technology" | "clothing" | "footwear";
const CAT: Record<Cat, Record<Lang, string>> = {
  technology: { th: "อุปกรณ์อิเล็กทรอนิกส์และไอที", en: "Electronics & Tech", ro: "Electronice și tehnologie" },
  clothing: { th: "เสื้อผ้า", en: "Clothing", ro: "Îmbrăcăminte" },
  footwear: { th: "รองเท้า", en: "Footwear", ro: "Încălțăminte" },
};

export function marketShare(lang: Lang, cat?: string) {
  const label = cat && cat in CAT ? CAT[cat as Cat][lang] : null;
  if (label) return {
    th: { title: `${label} ขาย — ตลาด iBuzz.wtf`, desc: `เลือกดู${label}ในตลาด iBuzz.wtf ดูรูป สภาพ และราคา แล้วสอบถามทาง LINE` },
    en: { title: `${label} for Sale — iBuzz.wtf Market`, desc: `Browse ${label.toLowerCase()} in the iBuzz.wtf Market. See photos, condition and prices, then enquire on LINE.` },
    ro: { title: `${label} de vânzare — Market iBuzz.wtf`, desc: `Răsfoiește ${label.toLowerCase()} în Market iBuzz.wtf. Vezi poze, starea și prețurile, apoi întreabă pe LINE.` },
  }[lang];
  return {
    th: { title: "ตลาด: อิเล็กทรอนิกส์ เสื้อผ้า และรองเท้า — iBuzz.wtf", desc: "อิเล็กทรอนิกส์ เสื้อผ้า และรองเท้ามือสองและมือหนึ่ง สำหรับผู้ชาย ผู้หญิง และเด็ก ค้นหา กรองตามสถานะ และสอบถามทาง LINE" },
    en: { title: "Market: Electronics, Clothing & Footwear — iBuzz.wtf", desc: "Shop pre-owned and new electronics, clothing and footwear for men, women and children. Search, filter by availability and enquire on LINE." },
    ro: { title: "Market: electronice, îmbrăcăminte și încălțăminte — iBuzz.wtf", desc: "Electronice, îmbrăcăminte și încălțăminte noi și second-hand pentru bărbați, femei și copii. Caută, filtrează după disponibilitate și întreabă pe LINE." },
  }[lang];
}

export const PRODUCT_SHARE: Record<Lang, { market: string; fallback: string; sold: string; enquire: string; generic: string }> = {
  th: { market: "ตลาด iBuzz.wtf", fallback: "รายละเอียดสินค้า", sold: "ขายแล้ว", enquire: "สอบถามทาง LINE", generic: "รูป สภาพ ราคา และสถานะสินค้า สอบถามทาง LINE" },
  en: { market: "iBuzz.wtf Market", fallback: "Product details", sold: "Sold out", enquire: "Enquire on LINE.", generic: "Photos, condition, price and availability. Enquire on LINE." },
  ro: { market: "Market iBuzz.wtf", fallback: "Detalii produs", sold: "Vândut", enquire: "Întreabă pe LINE.", generic: "Poze, stare, preț și disponibilitate. Întreabă pe LINE." },
};
