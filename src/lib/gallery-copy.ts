import type { Lang } from "./i18n";

const galleryCopy = {
  open: ["ขยายรูปภาพ", "Enlarge photo", "Mărește fotografia"],
  photo: ["รูปภาพ", "Photo", "Fotografia"],
  zoomIn: ["ซูมเข้า", "Zoom in", "Mărește"],
  zoomOut: ["ซูมออก", "Zoom out", "Micșorează"],
  reset: ["คืนขนาดเดิม", "Reset zoom", "Resetează mărirea"],
  previous: ["รูปก่อนหน้า", "Previous photo", "Fotografia anterioară"],
  next: ["รูปถัดไป", "Next photo", "Fotografia următoare"],
  close: ["ปิด", "Close", "Închide"],
} satisfies Record<string, [string, string, string]>;

// Concise per-photo captions keyed by the filename slug of the stored image
// (e.g. gaming-mouse-zelotes/label.jpg -> "label"). Describe only what the
// photo shows — never product specifications.
const captionBySlug: Partial<Record<string, [string, string, string]>> = {
  front: ["ด้านหน้า", "Front view", "Vedere frontală"],
  back: ["ด้านหลัง", "Back view", "Vedere din spate"],
  side: ["ด้านข้าง", "Side view", "Vedere laterală"],
  top: ["มุมบน", "Top view", "Vedere de sus"],
  label: ["ฉลากสินค้า", "Product label", "Eticheta produsului"],
  wireless: ["บริเวณชาร์จไร้สาย", "Wireless charging pad", "Zona de încărcare wireless"],
  ports: ["ช่องเชื่อมต่อ", "Ports", "Conectori"],
  "brand-port": ["ช่องเชื่อมต่อและตราสินค้า", "Ports and brand marking", "Conectori și marcă"],
};

export function galleryText(lang: Lang, key: keyof typeof galleryCopy) {
  return galleryCopy[key][lang === "th" ? 0 : lang === "en" ? 1 : 2];
}

export function photoCaption(lang: Lang, src: string): string | null {
  const file = decodeURIComponent(src).split("?")[0] ?? "";
  const slug = file.split("/").pop()?.replace(/\.\w+$/, "").toLowerCase() ?? "";
  if (!slug) return null;
  const entry = captionBySlug[slug];
  if (!entry) return null;
  const text = lang === "th" ? entry[0] : lang === "en" ? entry[1] : entry[2];
  return text ?? null;
}