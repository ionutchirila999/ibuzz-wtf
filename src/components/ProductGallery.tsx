import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff, X, ZoomIn } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger } from "./ui/dialog";
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

  if (!photos.length) return <div className="grid aspect-square w-full place-items-center rounded-2xl border border-border bg-muted/40 text-muted-foreground"><ImageOff className="h-8 w-8" aria-label={title} /></div>;

  return (
    <div className="w-full min-w-0">
      <div className="grid min-w-0 gap-3 sm:grid-cols-[76px_minmax(0,1fr)] lg:grid-cols-[88px_minmax(0,1fr)]">
        {photos.length > 1 && <div className="order-2 flex min-w-0 gap-2 overflow-x-auto pb-1 sm:order-1 sm:max-h-[560px] sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto sm:pr-1" role="group" aria-label={text("photo")}>
          {photos.map((src, i) => <button key={`${src}-${i}`} type="button" onClick={() => setActive(i)} aria-label={photoName(i)} aria-pressed={i === index} className={`relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-xl border-2 bg-white p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-[76px] sm:w-[76px] lg:h-[84px] lg:w-[84px] ${i === index ? "border-primary" : "border-border/70"}`}>
            <img src={src} alt="" loading={i === 0 ? "eager" : "lazy"} className="h-full w-full rounded-lg object-contain" />
          </button>)}
        </div>}
        <div className="order-1 min-w-0 sm:order-2">
          <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm">
            <DialogTrigger asChild>
              <button type="button" className="group relative block w-full cursor-zoom-in p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary" aria-label={text("open")}>
                <img src={current} alt={photoName(index)} fetchPriority="high" draggable={false} className="block aspect-square max-h-[min(88vw,620px)] w-full select-none object-contain p-3 sm:max-h-[620px] sm:p-6" />
                <span className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/95 px-3 py-2 text-xs font-medium text-foreground shadow-sm"><ZoomIn className="h-4 w-4" />{text("open")}</span>
              </button>
            </DialogTrigger>
            {photos.length > 1 && <>
              <Button type="button" variant="secondary" size="icon" onClick={() => step(-1)} aria-label={text("previous")} className="absolute left-3 top-1/2 z-10 size-10 -translate-y-1/2 rounded-full border border-border/70 bg-background/95 shadow-sm"><ChevronLeft className="h-5 w-5" /></Button>
              <Button type="button" variant="secondary" size="icon" onClick={() => step(1)} aria-label={text("next")} className="absolute right-3 top-1/2 z-10 size-10 -translate-y-1/2 rounded-full border border-border/70 bg-background/95 shadow-sm"><ChevronRight className="h-5 w-5" /></Button>
            </>}
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <p className="min-w-0 truncate">{caption ?? title}</p>
            {photos.length > 1 && <span className="shrink-0 tabular-nums">{index + 1} / {photos.length}</span>}
          </div>
        </div>
      </div>
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogPortal>
          <DialogOverlay className="bg-black/90" />
          <DialogContent className="fixed inset-0 z-50 flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col gap-0 rounded-none border-0 bg-neutral-950 p-0 text-white sm:inset-4 sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:w-auto sm:rounded-2xl sm:border sm:border-white/15">
            <div className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4">
              <DialogTitle className="min-w-0 truncate text-sm font-medium">{photoName(index)}</DialogTitle>
              <DialogClose asChild><Button type="button" variant="ghost" size="icon" aria-label={text("close")} className="size-10 shrink-0 text-white hover:bg-white/10 hover:text-white"><X /></Button></DialogClose>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-12 py-4 sm:px-20">
              <img src={current} alt={photoName(index)} draggable={false} className="max-h-full max-w-full select-none object-contain" />
              {photos.length > 1 && <>
                <Button type="button" variant="ghost" size="icon" onClick={() => step(-1)} aria-label={text("previous")} className="absolute left-2 top-1/2 size-11 -translate-y-1/2 rounded-full text-white hover:bg-white/10 hover:text-white sm:left-5"><ChevronLeft className="h-7 w-7" /></Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => step(1)} aria-label={text("next")} className="absolute right-2 top-1/2 size-11 -translate-y-1/2 rounded-full text-white hover:bg-white/10 hover:text-white sm:right-5"><ChevronRight className="h-7 w-7" /></Button>
              </>}
            </div>
            <div className="flex shrink-0 items-center justify-center border-t border-white/10 px-4 py-3 text-xs text-white/70">{index + 1} / {photos.length}</div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </div>
  );
}
