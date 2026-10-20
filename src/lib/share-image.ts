// Builds a small 1200x630 JPEG of a product's main photo for link previews
// (WhatsApp skips preview images over ~600 KB). Runs in the browser only — no AI.
export const SHARE_W = 1200;
export const SHARE_H = 630;
const BG = "#1F1548"; // brand theme colour, matches the app manifest

export async function makeShareImage(src: string): Promise<Blob> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = SHARE_W;
  canvas.height = SHARE_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, SHARE_W, SHARE_H);
  // Fit the whole photo (no cropping of the product) centred on the brand colour.
  const s = Math.min(SHARE_W / img.naturalWidth, SHARE_H / img.naturalHeight);
  const w = img.naturalWidth * s, h = img.naturalHeight * s;
  ctx.drawImage(img, (SHARE_W - w) / 2, (SHARE_H - h) / 2, w, h);
  for (const q of [0.82, 0.7, 0.55]) {
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", q));
    if (blob && blob.size < 300_000) return blob;
    if (blob && q === 0.55) return blob;
  }
  throw new Error("Could not create share image");
}
