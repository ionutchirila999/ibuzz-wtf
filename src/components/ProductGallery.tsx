import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ChevronLeft, ChevronRight, ImageOff, Play, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogClose, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger } from "./ui/dialog";
import { useT } from "@/lib/i18n";
import { galleryText, photoCaption } from "@/lib/gallery-copy";

export function ProductGallery({ images, title, videoUrl }: { images: string[]; title: string; videoUrl?: string | null }) {
  const [active, setActive] = useState(0);
  const { lang } = useT();
  const text = (key: Parameters<typeof galleryText>[1]) => galleryText(lang, key);
  const captions = images.map((src) => photoCaption(lang, src));
  let videoId: string | null = null;
  if (videoUrl) {
    try {
      const parsed = new URL(videoUrl);
      if (parsed.protocol === "https:" && (parsed.hostname === "tiktok.com" || parsed.hostname.endsWith(".tiktok.com"))) {
        videoId = parsed.pathname.match(/\/video\/(\d+)/)?.[1] ?? parsed.pathname.match(/\/player\/v1\/(\d+)/)?.[1] ?? null;
      }
    } catch { /* Ignore malformed URLs; the image gallery remains available. */ }
  }
  const hasVideo = Boolean(videoId);
  const totalItems = images.length + (hasVideo ? 1 : 0);
  const videoActive = hasVideo && active === 0;
  const currentImageIndex = active - (hasVideo ? 1 : 0);
  const image = videoActive ? undefined : images[currentImageIndex];
  const move = (direction: number) => setActive((current) => (current + direction + totalItems) % totalItems);
  const movePhoto = (direction: number) => {
    if (!images.length) return;
    const index = videoActive ? 0 : currentImageIndex;
    const next = (index + direction + images.length) % images.length;
    setActive(next + (hasVideo ? 1 : 0));
  };
  const photoLabel = (index: number) => {
    const caption = captions[index];
    const base = caption ?? `${text("photo")} ${index + 1} / ${images.length}`;
    return `${title} — ${base}`;
  };
  // Concise screen-reader label for thumbnails: the caption alone identifies
  // the photo without repeating the product title every time.
  const thumbLabel = (index: number) =>
    captions[index] ?? `${text("photo")} ${index + 1} / ${images.length}`;

  if (!images.length && !videoId) return <div className="grid aspect-square place-items-center rounded-lg border bg-muted text-muted-foreground"><ImageOff aria-label={title} /></div>;

  return (
    <Dialog>
      <div className="min-w-0">
        <div className="relative overflow-hidden rounded-lg border bg-muted">
          {videoActive ? <iframe title={title + " — " + text("productVideo")} src={"https://www.tiktok.com/player/v1/" + videoId + "?controls=1&description=0&music_info=0&loop=0"} className="block aspect-square w-full border-0 bg-black" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /> : image ? <DialogTrigger asChild>
            <Button variant="ghost" className="relative h-auto w-full overflow-hidden rounded-lg p-0 hover:bg-muted" aria-label={`${text("open")} — ${photoLabel(currentImageIndex)}`}>
              <img src={image} alt={photoLabel(currentImageIndex)} className="aspect-square w-full object-contain" />
              <span className="absolute bottom-3 right-3 grid size-11 place-items-center rounded-md border bg-background text-foreground"><ZoomIn aria-hidden="true" /></span>
            </Button>
          </DialogTrigger> : <div className="grid aspect-square place-items-center"><ImageOff aria-label={title} /></div>}
          {totalItems > 1 && <>
            <Button variant="ghost" size="icon" onClick={() => move(-1)} title={text("previous")} aria-label={text("previous")} className="absolute left-2 top-1/2 size-11 -translate-y-1/2 rounded-full border bg-background/90 text-foreground shadow-md">
              <ChevronLeft aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => move(1)} title={text("next")} aria-label={text("next")} className="absolute right-2 top-1/2 size-11 -translate-y-1/2 rounded-full border bg-background/90 text-foreground shadow-md">
              <ChevronRight aria-hidden="true" />
            </Button>
          </>}
        </div>
        {!videoActive && captions[currentImageIndex] && <p className="mt-1 text-center text-xs text-muted-foreground">{captions[currentImageIndex]}</p>}
        {images.length > 1 && <div className="mt-2 flex gap-2 overflow-x-auto py-1" role="group" aria-label={text("photo")}>
          {images.map((src, index) => <Button key={`${src}-${index}`} variant="ghost" onClick={() => setActive(index + (hasVideo ? 1 : 0))} aria-label={thumbLabel(index)} aria-current={index === currentImageIndex && !videoActive} className={`size-16 shrink-0 overflow-hidden rounded-md border-2 p-0 ${index === currentImageIndex && !videoActive ? "border-primary" : "border-transparent"}` }>
            <img src={src} alt="" className="h-full w-full object-cover" />
          </Button>)}
        </div>}

      </div>
      <DialogPortal>
        <DialogOverlay className="bg-background/90" />
        <DialogPrimitive.Content aria-describedby={undefined} className="fixed inset-2 z-50 flex flex-col overflow-hidden rounded-lg border bg-background text-foreground shadow-lg outline-none sm:inset-6" onKeyDown={(event) => {
          if (event.key === "ArrowLeft") { event.preventDefault(); movePhoto(-1); }
          if (event.key === "ArrowRight") { event.preventDefault(); movePhoto(1); }
        }}>
          <div className="flex min-h-14 shrink-0 items-center justify-between gap-2 border-b px-3">
            <DialogTitle className="min-w-0 truncate text-sm font-semibold">{title}</DialogTitle>
            <DialogClose asChild><Button size="icon" variant="ghost" className="size-11 shrink-0" title={text("close")} aria-label={text("close")}><X /></Button></DialogClose>
          </div>
          <TransformWrapper key={image} initialScale={1} minScale={1} maxScale={8} wheel={{ step: 0.002 }} doubleClick={{ mode: "toggle", step: 1 }}>
            {({ zoomIn, zoomOut, resetTransform }) => <>
              <div className="relative min-h-0 flex-1 overflow-hidden bg-muted">
                <TransformComponent wrapperClass="!h-full !w-full !touch-none" contentClass="!h-full !w-full">
                  <img src={image} alt={photoLabel(currentImageIndex)} draggable={false} className="h-full w-full select-none object-contain" />
                </TransformComponent>
                {captions[currentImageIndex] && <span aria-hidden="true" className="pointer-events-none absolute bottom-3 left-3 max-w-[75%] truncate rounded-md bg-background/85 px-2 py-1 text-xs text-foreground">{captions[currentImageIndex]}</span>}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-1 border-t p-2">
                <Button variant="ghost" size="icon" className="size-11" disabled={images.length < 2} onClick={() => movePhoto(-1)} title={text("previous")} aria-label={text("previous")}><ChevronLeft /></Button>
                <span className="w-14 text-center text-sm tabular-nums" aria-live="polite" aria-atomic="true">{Math.max(0, currentImageIndex) + 1} / {images.length}</span>
                <Button variant="ghost" size="icon" className="size-11" disabled={images.length < 2} onClick={() => movePhoto(1)} title={text("next")} aria-label={text("next")}><ChevronRight /></Button>
                <span className="mx-1 h-6 border-l" aria-hidden="true" />
                <Button variant="ghost" size="icon" className="size-11" onClick={() => zoomOut()} title={text("zoomOut")} aria-label={text("zoomOut")}><ZoomOut /></Button>
                <Button variant="ghost" size="icon" className="size-11" onClick={() => zoomIn()} title={text("zoomIn")} aria-label={text("zoomIn")}><ZoomIn /></Button>
                <Button variant="ghost" size="icon" className="size-11" onClick={() => resetTransform()} title={text("reset")} aria-label={text("reset")}><RotateCcw /></Button>
              </div>
            </>}
          </TransformWrapper>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}