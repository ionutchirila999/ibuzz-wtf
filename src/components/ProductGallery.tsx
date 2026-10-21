import { useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ChevronLeft, ChevronRight, ImageOff, Play, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogClose, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger } from "./ui/dialog";
import { useT } from "@/lib/i18n";
import { galleryText, photoCaption } from "@/lib/gallery-copy";

export function ProductGallery({ images, title, videoUrl }: { images: string[]; title: string; videoUrl?: string | null }) {
  const [active, setActive] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const thumbnailStrip = useRef<HTMLDivElement>(null);
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
  // Lead with the product itself; video is supplementary media at the end.
  const videoActive = hasVideo && active === images.length;
  const currentImageIndex = videoActive ? 0 : Math.min(active, Math.max(0, images.length - 1));
  const image = videoActive ? undefined : images[currentImageIndex];
  const move = (direction: number) => setActive((current) => (current + direction + totalItems) % totalItems);
  const selectPhoto = (index: number) => {
    setActive(index);
    thumbnailStrip.current?.querySelectorAll<HTMLButtonElement>("button")[index]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };
  const movePhoto = (direction: number) => {
    if (!images.length) return;
    const index = videoActive ? 0 : currentImageIndex;
    const next = (index + direction + images.length) % images.length;
    setActive(next);
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
    <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
      <div className="min-w-0">
        <div className="group relative isolate mx-auto min-w-0 max-w-2xl overflow-hidden rounded-2xl border border-border/70 bg-muted/40 shadow-sm sm:rounded-3xl">
          {videoActive ? <iframe title={title + " — " + text("productVideo")} src={"https://www.tiktok.com/player/v1/" + videoId + "?controls=1&description=0&music_info=0&loop=0"} className="block aspect-square max-h-[min(76vw,560px)] w-full border-0 bg-neutral-950 sm:aspect-[5/4] sm:max-h-[560px]" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /> : image ? <DialogTrigger asChild>
            <Button variant="ghost" className="relative h-auto w-full overflow-hidden rounded-xl p-0 hover:bg-muted sm:rounded-2xl" aria-label={`${text("open")} — ${photoLabel(currentImageIndex)}`}>
              <img src={image} alt={photoLabel(currentImageIndex)} className="aspect-square max-h-[min(76vw,560px)] w-full bg-white object-contain p-3 sm:aspect-[5/4] sm:max-h-[560px] sm:p-5" />
              <span className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-xl border border-white/15 bg-background/85 text-foreground shadow-lg backdrop-blur"><ZoomIn aria-hidden="true" /></span>
            </Button>
          </DialogTrigger> : <div className="grid aspect-square place-items-center"><ImageOff aria-label={title} /></div>}
          {videoActive && <Button type="button" variant="secondary" size="icon" onClick={() => setZoomOpen(true)} title={text("open")} aria-label={text("open")} className="absolute bottom-2 right-2 size-9 rounded-full border bg-background/85 text-foreground shadow-sm"><ZoomIn aria-hidden="true" /></Button>}
          {totalItems > 1 && <>
            <Button variant="ghost" size="icon" onClick={() => move(-1)} title={text("previous")} aria-label={text("previous")} type="button" onPointerDown={(event) => event.stopPropagation()} className="absolute left-2 top-1/2 size-8 -translate-y-1/2 rounded-full border border-white/10 bg-background/70 text-foreground/90 shadow-sm backdrop-blur transition hover:bg-background hover:text-foreground sm:left-3 sm:size-9">
              <ChevronLeft aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => move(1)} title={text("next")} aria-label={text("next")} type="button" onPointerDown={(event) => event.stopPropagation()} className="absolute right-2 top-1/2 size-8 -translate-y-1/2 rounded-full border border-white/10 bg-background/70 text-foreground/90 shadow-sm backdrop-blur transition hover:bg-background hover:text-foreground sm:right-3 sm:size-9">
              <ChevronRight aria-hidden="true" />
            </Button>
          </>}
        </div>
        {!videoActive && captions[currentImageIndex] && <p className="mt-1 text-center text-xs text-muted-foreground">{captions[currentImageIndex]}</p>}
        {images.length > 1 && <div ref={thumbnailStrip} onWheel={(event) => { if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) { event.preventDefault(); event.currentTarget.scrollLeft += event.deltaY; } }} className="mx-auto mt-3 flex max-w-2xl snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain px-1 py-2 touch-pan-x scroll-smooth [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,.35)_transparent]" role="group" aria-label={text("photo")}>
          {images.map((src, index) => <Button key={`${src}-${index}`} variant="ghost" onClick={() => selectPhoto(index)} aria-label={thumbLabel(index)} aria-current={index === currentImageIndex && !videoActive} className={`size-[68px] shrink-0 snap-start overflow-hidden rounded-xl border-2 bg-background p-0 transition sm:size-20 ${index === currentImageIndex && !videoActive ? "border-primary ring-2 ring-primary/15" : "border-border/70 opacity-75 hover:opacity-100"}` }>
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
          {videoActive ? <div className="relative min-h-0 flex-1 overflow-hidden bg-black"><iframe title={title + " — " + text("productVideo")} src={"https://www.tiktok.com/player/v1/" + videoId + "?controls=1&description=0&music_info=0&loop=0"} className="h-full w-full border-0" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /></div> : <TransformWrapper key={image} initialScale={1} minScale={1} maxScale={8} wheel={{ step: 0.002 }} doubleClick={{ mode: "toggle", step: 1 }}>
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
          </TransformWrapper>}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}