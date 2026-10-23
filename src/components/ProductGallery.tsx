import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff, Maximize2, Play } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { useT } from "@/lib/i18n";
import { galleryText, photoCaption } from "@/lib/gallery-copy";
import { supabase } from "@/integrations/supabase/client";

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365 * 10;
function productStoragePath(src: string) {
  try {
    const path = new URL(src).pathname.match(/\\/storage\\/v1\\/object\\/sign\\/product-images\\/(.+)$/)?.[1];
    return path ? decodeURIComponent(path) : null;
  } catch {
    return null;
  }
}

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [failedMedia, setFailedMedia] = useState<string | null>(null);
  const [refreshedVideos, setRefreshedVideos] = useState<Record<string, string>>({});
  const refreshAttempted = useRef(new Set<string>());
  const { lang } = useT();
  const text = (key: Parameters<typeof galleryText>[1]) => galleryText(lang, key);
  const photos = images.filter((src): src is string => typeof src === "string" && src.trim().length > 0);
  const isVideo = (src: string) => /\.(mp4|webm|mov|m4v)(?:$|[?#])/i.test(src);
  const currentIsVideo = photos[active] ? isVideo(photos[active]) : false;
  const index = photos.length ? Math.min(active, photos.length - 1) : 0;
  const current = photos[index];
  const resolvedCurrent = current ? refreshedVideos[current] ?? current : current;
  const recoverVideo = async (original: string, failedSource: string) => {
    if (refreshAttempted.current.has(original)) { setFailedMedia(original); return; }
    refreshAttempted.current.add(original);
    const path = productStoragePath(failedSource) ?? productStoragePath(original);
    if (!path) { setFailedMedia(original); return; }
    const { data, error } = await supabase.storage.from("product-images").createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
    if (error || !data?.signedUrl || data.signedUrl === failedSource) { setFailedMedia(original); return; }
    setRefreshedVideos((previous) => ({ ...previous, [original]: data.signedUrl }));
  };
  // Reuse an existing product photo as the video poster whenever one is available.
  const videoPoster = photos.find((src) => !isVideo(src));
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
          <div className="relative">
            <div className="flex h-[clamp(280px,42vw,440px)] w-full items-center justify-center p-2.5 sm:h-[clamp(320px,38vw,420px)] sm:p-4 lg:h-[clamp(340px,34vw,460px)]">
              {failedMedia === current ? <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400" role="img" aria-label="Product media unavailable"><ImageOff className="h-8 w-8" /><span className="text-xs">Preview unavailable</span></div> : currentIsVideo ? <div className="relative flex h-full w-full items-center justify-center"><ImageOff className="absolute h-8 w-8 text-slate-700" /><video key={resolvedCurrent} ref={videoRef} src={resolvedCurrent} poster={videoPoster} controls playsInline preload="metadata" onError={() => { void recoverVideo(current, resolvedCurrent); }} onPlay={() => setVideoPlaying(true)} onPause={() => setVideoPlaying(false)} className="relative h-full w-full select-none object-contain" aria-label={photoName(index)} />{!videoPlaying && <button type="button" onClick={() => { void videoRef.current?.play().catch(() => undefined); }} aria-label="Play product video" className="absolute left-1/2 top-1/2 z-10 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-200/70 bg-slate-950/85 text-cyan-100 shadow-[0_0_32px_rgba(34,211,238,0.35)] backdrop-blur transition hover:scale-105 hover:bg-slate-900"><Play className="ml-1 h-7 w-7 fill-current" /></button>}</div> : <button type="button" onClick={() => setLightboxOpen(true)} className="group relative block h-full w-full cursor-zoom-in p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300" aria-label={text("open")}><img src={current} alt={photoName(index)} fetchPriority="high" onError={() => setFailedMedia(current)} draggable={false} className="h-full w-full select-none object-contain" /><span className="absolute bottom-2 right-2 inline-flex size-8 items-center justify-center rounded-lg border border-white/10 bg-slate-950/80 text-cyan-100 shadow-lg backdrop-blur-md transition-colors group-hover:border-cyan-300/40" title={text("open")}><Maximize2 className="h-3.5 w-3.5" /></span></button>}
            </div>
            {currentIsVideo && <button type="button" onClick={() => setLightboxOpen(true)} aria-label={text("open")} title="Enlarge video" className="absolute bottom-3 right-3 inline-flex size-8 items-center justify-center rounded-lg border border-white/10 bg-slate-950/85 text-cyan-100 shadow-lg backdrop-blur-md hover:border-cyan-300/40"><Maximize2 className="h-3.5 w-3.5" /></button>}
          </div>
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
              {isVideo(src) ? <span className="flex h-full w-full items-center justify-center rounded-md bg-slate-900 text-cyan-100/80"><Play className="h-5 w-5 fill-current" /></span> : <span className="relative flex h-full w-full items-center justify-center rounded-md bg-slate-900 text-slate-500"><ImageOff className="h-4 w-4" /><img src={src} alt="" loading={i === 0 ? "eager" : "lazy"} onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} draggable={false} className="absolute inset-0 h-full w-full rounded-md object-contain" /></span>}
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
            {failedMedia === current ? <div className="flex flex-col items-center gap-2 text-slate-400"><ImageOff className="h-8 w-8" /><span className="text-xs">Preview unavailable</span></div> : currentIsVideo ? <video key={resolvedCurrent} src={resolvedCurrent} poster={videoPoster} controls autoPlay playsInline onError={() => { void recoverVideo(current, resolvedCurrent); }} className="relative max-h-full max-w-full select-none object-contain" aria-label={photoName(index)} /> : <img src={current} alt={photoName(index)} onError={() => setFailedMedia(current)} draggable={false} className="relative max-h-full max-w-full select-none object-contain" />}
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
