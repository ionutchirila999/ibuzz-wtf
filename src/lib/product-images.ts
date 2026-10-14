// Free, browser-only image helpers for the owner dashboard. No AI or paid services.
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // matches the storage bucket limit
export const MAX_IMAGE_EDGE = 1600; // saved images are resized so the longest side is at most this

export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) return "Only JPG, PNG or WebP photos are allowed";
  if (file.size > MAX_IMAGE_BYTES) return "Photo is larger than 10 MB";
  if (file.size === 0) return "Photo file is empty";
  return null;
}

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}

export function fitWithin(w: number, h: number, max = MAX_IMAGE_EDGE) {
  const s = Math.min(1, max / Math.max(w, h));
  return { width: Math.round(w * s), height: Math.round(h * s) };
}

export type Area = { x: number; y: number; width: number; height: number };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("Could not load photo"));
    img.src = src;
  });
}

/** Rotate, crop and resize in the browser; returns a JPEG blob. */
export async function renderEdited(src: string, crop: Area, rotation: number, maxEdge = MAX_IMAGE_EDGE): Promise<Blob> {
  const img = await loadImage(src);
  const rad = (rotation * Math.PI) / 180;
  const bw = Math.abs(Math.cos(rad) * img.width) + Math.abs(Math.sin(rad) * img.height);
  const bh = Math.abs(Math.sin(rad) * img.width) + Math.abs(Math.cos(rad) * img.height);
  const rot = document.createElement("canvas");
  rot.width = bw; rot.height = bh;
  const rc = rot.getContext("2d")!;
  rc.translate(bw / 2, bh / 2); rc.rotate(rad); rc.drawImage(img, -img.width / 2, -img.height / 2);
  const out = document.createElement("canvas");
  const size = fitWithin(crop.width, crop.height, maxEdge);
  out.width = size.width; out.height = size.height;
  const oc = out.getContext("2d")!;
  oc.fillStyle = "#ffffff"; oc.fillRect(0, 0, out.width, out.height);
  oc.drawImage(rot, crop.x, crop.y, crop.width, crop.height, 0, 0, out.width, out.height);
  return new Promise((res, rej) => out.toBlob((b) => (b ? res(b) : rej(new Error("Could not save photo"))), "image/jpeg", 0.88));
}
