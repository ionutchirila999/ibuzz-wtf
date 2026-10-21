import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff, Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { useT } from "@/lib/i18n";
import { galleryText, photoCaption } from "@/lib/gallery-copy";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { lang } = useT();
  const text = (key: Parameters<typeof galleryText>[1]) => galleryText(lang, key);
  const photos = images.filter((src): src is string => typeof src === "string" && src.trim().length > 0);
  const index = photos.length ? Math.min(active, photos.length - 1) : 0;
  const current = photos[index];
  const caption = current ? photoCaption(lang, current) : null;
  const step = (delta: number) => setActive((n) => (n + delta + photos.length) % photos.length);
  const photoName = (i: number) => {
    const c = photoCaption(lang, photos[i] ?? "");
    return c ? `${title} — ${c}` : `${title} — ${text("photo")} ${i + 1} / ${photos.length}`;
  };
  const arrowClass = "absolute top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/85 text-cyan-100 shadow-lg shadow-black/20 backdrop-blur-md transition-colors hover:border-cyan-300/50 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300";

  if (!photos.length) return <div className="grid aspect-[4/3] w-full place-items-center rounded-xl border border-cyan-300/15 bg-slate-950/55 text-cyan-100/45"><ImageOff className="h-7 w-7" aria-label={title} /></div>;

  return (
    <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
      <section className="w-full min-w-0" aria-label={title}>
        <div className="relative overflow-hidden rounded-xl border border-cyan-300/15 bg-slate-950/70 shadow-[0_12px_40px_-28px_rgba(34,211,238,0.4)]">
          <button type="button" onClick={() => setLightboxOpen(true)} className="group relative block w-full cursor-zoom-in p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300" aria-label={text("open")}>
            <div className="flex h-[clamp(280px,42vw,440px)] w-full items-center justify-center p-2.5 sm:h-[clamp(320px,38vw,420px)] sm:p-4 lg:h-[clamp(340px,34vw,460px)]"><img src={current} alt={photoName(index)} fetchPriority="high" draggable={false} className="h-full w-full select-none object-contain" /></div>
            <span className="absolute bottom-2 right-2 inline-flex size-8 items-center justify-center rounded-lg border border-white/10 bg-slate-950/80 text-cyan-100 shadow-lg backdrop-blur-md transition-colors group-hover:border-cyan-300/40" title={text("open")}><Maximize2 className="h-3.5 w-3.5" /></span>
          </button>
          {photos.length > 1 && <>
            <button type="button" onClick={() => step(-1)} aria-label={text("previous")} className={`${arrowClass} left-2`}><ChevronLeft className="h-4 w-4" /></button>
            <button type="button" onClick={() => step(1)} aria-label={text("next")} className={`${arrowClass} right-2`}><ChevronRight className="h-4 w-4" /></button>
          </>}
          <div className="flex min-h-8 items-center justify-between gap-3 border-t border-cyan-300/10 bg-slate-950/75 px-3 py-1.5">
            <p className="min-w-0 truncate text-[11px] text-slate-300/75">{caption ?? title}</p>
            {photos.length > 1 && <span className="shrink-0 rounded-md border border-cyan-300/15 bg-slate-900 px-2 py-0.5 font-mono text-[10px] tabular-nums text-cyan-100/80">{String(index + 1).padStart(2, "0")} <span className="text-slate-500">/</span> {String(photos.length).padStart(2, "0")}</span>}
          </div>
        </div>
        {photos.length > 1 && <div className="mt-2 flex min-w-0 items-center gap-2">
          <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto py-0.5 [scrollbar-width:thin]" role="group" aria-label={text("photo")}>
            {photos.map((src, i) => <button key={`${src}-${i}`} type="button" onClick={() => setActive(i)} aria-label={photoName(i)} aria-pressed={i === index} className={`relative h-[50px] w-[50px] shrink-0 overflow-hidden rounded-lg border bg-slate-950 p-0.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-cyan-300 sm:h-[54px] sm:w-[54px] ${i === index ? "border-cyan-300 shadow-[0_0_0_1px_rgba(103,232,249,0.25)]" : "border-white/10 hover:border-cyan-300/40"}`}>
              <img src={src} alt="" loading={i === 0 ? "eager" : "lazy"} draggable={false} className="h-full w-full rounded-md object-contain" />
              {i === index && <span className="absolute inset-x-1 bottom-1 h-0.5 rounded-full bg-cyan-300" />}
            </button>)}
          </div>
          <span className="shrink-0 text-[10px] font-medium tracking-wide text-slate-400">{text("photo").toUpperCase()}</span>
        </div>}
      </section>
      <DialogContent className="fixed inset-2 z-50 flex h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-xl border border-cyan-300/20 bg-slate-950 p-0 text-white shadow-[0_0_80px_-30px_rgba(34,211,238,0.25)] data-[state=open]:animate-none data-[state=closed]:animate-none sm:inset-5 sm:h-[calc(100dvh-2.5rem)] sm:max-h-[calc(100dvh-2.5rem)] sm:w-[calc(100%-2.5rem)] sm:rounded-2xl">
          <div className="flex min-h-12 shrink-0 items-center justify-between gap-3 border-b border-cyan-300/15 px-3 sm:px-4">
            <DialogTitle className="min-w-0 truncate text-xs font-medium text-slate-200 sm:text-sm">{photoName(index)}</DialogTitle>
            
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3 sm:p-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.07),transparent_65%)]" />
            <img src={current} alt={photoName(index)} draggable={false} className="relative max-h-full max-w-full select-none object-contain" />
            {photos.length > 1 && <>
              <button type="button" onClick={() => step(-1)} aria-label={text("previous")} className={`${arrowClass} left-2 sm:left-4`}><ChevronLeft className="h-5 w-5" /></button>
              <button type="button" onClick={() => step(1)} aria-label={text("next")} className={`${arrowClass} right-2 sm:right-4`}><ChevronRight className="h-5 w-5" /></button>
            </>}
          </div>
          <div className="flex shrink-0 items-center justify-center border-t border-cyan-300/15 px-4 py-2 text-[11px] font-medium tracking-wide text-slate-400">{String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}</div>
      </DialogContent>
    </Dialog>
  );
}
