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

export function galleryText(lang: Lang, key: keyof typeof galleryCopy) {
  return galleryCopy[key][lang === "th" ? 0 : lang === "en" ? 1 : 2];
}