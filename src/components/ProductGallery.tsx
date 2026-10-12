import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ChevronLeft, ChevronRight, ImageOff, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogClose, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger } from "./ui/dialog";
import { useT } from "@/lib/i18n";
import { galleryText } from "@/lib/gallery-copy";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const { lang } = useT();
  const text = (key: Parameters<typeof galleryText>[1]) => galleryText(lang, key);
  const image = images[active];
  const move = (direction: number) => setActive((current) => (current + direction + images.length) % images.length);
  const photoLabel = (index: number) => `${title} — ${text("photo")} ${index + 1} / ${images.length}`;

  if (!image) return <div className="grid aspect-square place-items-center rounded-lg border bg-muted text-muted-foreground"><ImageOff aria-label={title} /></div>;

  return (
    <Dialog>
      <div>
        <DialogTrigger asChild>
          <Button variant="ghost" className="relative h-auto w-full overflow-hidden rounded-lg border bg-muted p-0 hover:bg-muted" aria-label={`${text("open")} — ${photoLabel(active)}`}>
            <img src={image} alt={photoLabel(active)} className="aspect-square w-full object-contain" />
            <span className="absolute bottom-3 right-3 grid size-11 place-items-center rounded-md border bg-background text-foreground"><ZoomIn aria-hidden="true" /></span>
          </Button>
        </DialogTrigger>
        {images.length > 1 && <div className="mt-2 flex gap-2 overflow-x-auto py-1">
          {images.map((src, index) => <Button key={`${src}-${index}`} variant="ghost" onClick={() => setActive(index)} aria-label={photoLabel(index)} aria-pressed={index === active} className={`size-16 shrink-0 overflow-hidden rounded-md border-2 p-0 ${index === active ? "border-primary" : "border-transparent"}`}>
            <img src={src} alt="" className="h-full w-full object-cover" />
          </Button>)}
        </div>}
      </div>
      <DialogPortal>
        <DialogOverlay className="bg-background/90" />
        <DialogPrimitive.Content aria-describedby={undefined} className="fixed inset-2 z-50 flex flex-col overflow-hidden rounded-lg border bg-background text-foreground shadow-lg outline-none sm:inset-6" onKeyDown={(event) => {
          if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
          if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
        }}>
          <div className="flex min-h-14 items-center justify-between gap-2 border-b px-3">
            <DialogTitle className="min-w-0 truncate text-sm font-semibold">{title}</DialogTitle>
            <DialogClose asChild><Button size="icon" variant="ghost" className="size-11 shrink-0" title={text("close")} aria-label={text("close")}><X /></Button></DialogClose>
          </div>
          <TransformWrapper key={image} initialScale={1} minScale={1} maxScale={8} wheel={{ step: 0.002 }} doubleClick={{ mode: "toggle", step: 1 }}>
            {({ zoomIn, zoomOut, resetTransform }) => <>
              <div className="relative min-h-0 flex-1 overflow-hidden bg-muted">
                <TransformComponent wrapperClass="!h-full !w-full !touch-none" contentClass="!h-full !w-full">
                  <img src={image} alt={photoLabel(active)} draggable={false} className="h-full w-full select-none object-contain" />
                </TransformComponent>
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