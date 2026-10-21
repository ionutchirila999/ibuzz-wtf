import { useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Crop, RefreshCw, Star, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ImageEditor } from "./ImageEditor";
import { moveItem, validateImageFile } from "@/lib/product-images";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const isVideoUrl = (src: string) => /\\.(mp4|webm|mov|m4v)(?:$|[?#])/i.test(src);

export async function store(file: Blob, name: string): Promise<string> {
  const path = `${crypto.randomUUID()}-${name.replace(/[^a-z0-9.]/gi, "_")}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type || "image/jpeg" });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from("product-images").createSignedUrl(path, TEN_YEARS);
  if (e2 || !data) throw e2 ?? new Error("Could not create link");
  return data.signedUrl;
}

/** Owner-only photo list: add, replace, edit, delete, reorder, choose main (first) photo. */
export function ImageManager({ images, onChange, onBusy }: { images: string[]; onChange: (v: string[]) => void; onBusy: (b: boolean) => void }) {
  const addRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [replaceIdx, setReplaceIdx] = useState<number | null>(null);
  const [editing, setEditing] = useState<{ idx: number; src: string } | null>(null);

  async function add(files: FileList | null) {
    if (!files?.length) return;
    onBusy(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const video = VIDEO_TYPES.includes(file.type);
      const bad = video ? (file.size > 50 * 1024 * 1024 ? "Video must be 50 MB or smaller" : file.size === 0 ? "Video file is empty" : null) : validateImageFile(file);
      if (bad) { toast.error(`${file.name}: ${bad}`); continue; }
      try { urls.push(await store(file, file.name)); } catch (e) { const message = (e as Error).message || 'Upload failed'; toast.error(/maximum allowed size|file size limit|payload too large/i.test(message) ? `${file.name}: Supabase Storage rejected this file size. The bucket limit must be raised in Supabase.` : `${file.name}: ${message}`); }
    }
    onChange([...images, ...urls]);
    onBusy(false);
  }

  async function replace(files: FileList | null) {
    const file = files?.[0];
    if (!file || replaceIdx === null) return;
    const bad = validateImageFile(file);
    if (bad) { toast.error(bad); return; }
    onBusy(true);
    try { const url = await store(file, file.name); onChange(images.map((s, i) => (i === replaceIdx ? url : s))); toast.success("Photo replaced — remember to save the listing"); }
    catch (e) { toast.error((e as Error).message); }
    onBusy(false); setReplaceIdx(null);
  }

  function openEditor(idx: number) {
    const file = images[idx];
    if (file) setEditing({ idx, src: file });
  }

  return (
    <div>
      <div className="mt-1 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((src, i) => (
          <div key={src} className="overflow-hidden rounded-md border bg-card">
            <div className="relative aspect-square">
              {isVideoUrl(src) ? <video src={src} muted playsInline preload="metadata" className="h-full w-full object-cover" /> : <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />}
              {i === 0 && <span className="absolute left-1 top-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">Main</span>}
            </div>
            <div className="grid grid-cols-3 gap-1 p-1">
              <Button type="button" size="icon" variant="ghost" className="h-9 w-full" aria-label="Move left" disabled={i === 0} onClick={() => onChange(moveItem(images, i, i - 1))}><ArrowLeft className="h-4 w-4" /></Button>
              <Button type="button" size="icon" variant="ghost" className="h-9 w-full" aria-label="Set as main photo" disabled={i === 0} onClick={() => onChange(moveItem(images, i, 0))}><Star className="h-4 w-4" /></Button>
              <Button type="button" size="icon" variant="ghost" className="h-9 w-full" aria-label="Move right" disabled={i === images.length - 1} onClick={() => onChange(moveItem(images, i, i + 1))}><ArrowRight className="h-4 w-4" /></Button>
              <Button type="button" size="icon" variant="ghost" className="h-9 w-full" aria-label="Crop, rotate or resize" onClick={() => openEditor(i)}><Crop className="h-4 w-4" /></Button>
              <Button type="button" size="icon" variant="ghost" className="h-9 w-full" aria-label="Replace photo" onClick={() => { setReplaceIdx(i); replaceRef.current?.click(); }}><RefreshCw className="h-4 w-4" /></Button>
              <Button type="button" size="icon" variant="ghost" className="h-9 w-full text-destructive" aria-label="Delete photo" onClick={() => { if (confirm("Remove this photo from the listing?")) onChange(images.filter((_, j) => j !== i)); }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => addRef.current?.click()} className="grid aspect-square place-items-center rounded-md border border-dashed text-muted-foreground">
          <span className="flex flex-col items-center gap-1 text-xs"><Upload className="h-5 w-5" />Add photos or video</span>
        </button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Photos: JPG, PNG or WebP up to 10 MB. Videos: MP4, WebM or MOV up to 50 MB. Reorder media with ★ to choose the main photo or video. Save the listing to apply changes.</p>
      <input ref={addRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      <input ref={replaceRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { replace(e.target.files); e.target.value = ""; }} />
      {editing && (
        <ImageEditor src={editing.src} onCancel={() => setEditing(null)} onSave={async (blob) => {
          try { const url = await store(blob, "edited.jpg"); onChange(images.map((s, i) => (i === editing.idx ? url : s))); setEditing(null); toast.success("Photo updated — remember to save the listing"); }
          catch (e) { toast.error((e as Error).message); }
        }} />
      )}
    </div>
  );
}
