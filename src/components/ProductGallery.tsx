import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ArrowUpRight, ChevronLeft, ChevronRight, ImageOff, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogClose, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger } from "./ui/dialog";
import { useT } from "@/lib/i18n";
import { galleryText, photoCaption } from "@/lib/gallery-copy";

export function ProductGallery({ images, title, videoUrl }: { images: string[]; title: string; videoUrl?: string | null }) {
  const [active, setActive] = useState(0);
  const { lang } = useT();
  const text = (key: Parameters<typeof galleryText>[1]) => galleryText(lang, key);
  const image = images[active];
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
  const move = (direction: number) => setActive((current) => (current + direction + images.length) % images.length);
  const photoLabel = (index: number) => {
    const caption = captions[index];
    const base = caption ?? `${text("photo")} ${index + 1} / ${images.length}`;
    return `${title} — ${base}`;
  };
  // Concise screen-reader label for thumbnails: the caption alone identifies
  // the photo without repeating the product title every time.
  const thumbLabel = (index: number) =>
    captions[index] ?? `${text("photo")} ${index + 1} / ${images.length}`;

  if (!image) return <div className="grid aspect-square place-items-center rounded-lg border bg-muted text-muted-foreground"><ImageOff aria-label={title} /></div>;

  return (
    <Dialog>
      <div className="min-w-0">
        <div className="relative">
          <DialogTrigger asChild>
            <Button variant="ghost" className="relative h-auto w-full overflow-hidden rounded-lg border bg-muted p-0 hover:bg-muted" aria-label={`${text("open")} — ${photoLabel(active)}`}>
              <img src={image} alt={photoLabel(active)} className="aspect-square w-full object-contain" />
              <span className="absolute bottom-3 right-3 grid size-11 place-items-center rounded-md border bg-background text-foreground"><ZoomIn aria-hidden="true" /></span>
            </Button>
          </DialogTrigger>
          {images.length > 1 && <>
            <Button variant="ghost" size="icon" onClick={() => move(-1)} title={text("previous")} aria-label={text("previous")} className="absolute left-2 top-1/2 size-11 -translate-y-1/2 rounded-full border bg-background/90 text-foreground shadow-md">
              <ChevronLeft aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => move(1)} title={text("next")} aria-label={text("next")} className="absolute right-2 top-1/2 size-11 -translate-y-1/2 rounded-full border bg-background/90 text-foreground shadow-md">
              <ChevronRight aria-hidden="true" />
            </Button>
          </>}
        </div>
        {captions[active] && <p className="mt-1 text-center text-xs text-muted-foreground">{captions[active]}</p>}
        {images.length > 1 && <div className="mt-2 flex gap-2 overflow-x-auto py-1" role="group" aria-label={text("photo")}>
          {images.map((src, index) => <Button key={`${src}-${index}`} variant="ghost" onClick={() => setActive(index)} aria-label={thumbLabel(index)} aria-current={index === active} className={`size-16 shrink-0 overflow-hidden rounded-md border-2 p-0 ${index === active ? "border-primary" : "border-transparent"}`}>
            <img src={src} alt="" className="h-full w-full object-cover" />
          </Button>)}
        </div>}
        {videoUrl && <div className="mt-4 overflow-hidden rounded-xl border bg-card">
          <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
            <p className="text-sm font-semibold">{text("productVideo")}</p>
            <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 text-sm text-primary underline-offset-4 hover:underline">
              {text("openTikTok")} <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
          {videoId
            ? <iframe title={title + " — " + text("productVideo")} src={"https://www.tiktok.com/player/v1/" + videoId + "?controls=1&description=0&music_info=0&loop=0"} className="block aspect-[9/16] max-h-[560px] w-full border-0 bg-black" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
            : <p className="p-3 text-sm text-muted-foreground">{text("openTikTok")}</p>}
        </div>}
      </div>
      <DialogPortal>
        <DialogOverlay className="bg-background/90" />
        <DialogPrimitive.Content aria-describedby={undefined} className="fixed inset-2 z-50 flex flex-col overflow-hidden rounded-lg border bg-background text-foreground shadow-lg outline-none sm:inset-6" onKeyDown={(event) => {
          if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
          if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
        }}>
          <div className="flex min-h-14 shrink-0 items-center justify-between gap-2 border-b px-3">
            <DialogTitle className="min-w-0 truncate text-sm font-semibold">{title}</DialogTitle>
            <DialogClose asChild><Button size="icon" variant="ghost" className="size-11 shrink-0" title={text("close")} aria-label={text("close")}><X /></Button></DialogClose>
          </div>
          <TransformWrapper key={image} initialScale={1} minScale={1} maxScale={8} wheel={{ step: 0.002 }} doubleClick={{ mode: "toggle", step: 1 }}>
            {({ zoomIn, zoomOut, resetTransform }) => <>
              <div className="relative min-h-0 flex-1 overflow-hidden bg-muted">
                <TransformComponent wrapperClass="!h-full !w-full !touch-none" contentClass="!h-full !w-full">
                  <img src={image} alt={photoLabel(active)} draggable={false} className="h-full w-full select-none object-contain" />
                </TransformComponent>
                {captions[active] && <span aria-hidden="true" className="pointer-events-none absolute bottom-3 left-3 max-w-[75%] truncate rounded-md bg-background/85 px-2 py-1 text-xs text-foreground">{captions[active]}</span>}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-1 border-t p-2">
                <Button variant="ghost" size="icon" className="size-11" disabled={images.length < 2} onClick={() => move(-1)} title={text("previous")} aria-label={text("previous")}><ChevronLeft /></Button>
                <span className="w-14 text-center text-sm tabular-nums" aria-live="polite" aria-atomic="true">{active + 1} / {images.length}</span>
                <Button variant="ghost" size="icon" className="size-11" disabled={images.length < 2} onClick={() => move(1)} title={text("next")} aria-label={text("next")}><ChevronRight /></Button>
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