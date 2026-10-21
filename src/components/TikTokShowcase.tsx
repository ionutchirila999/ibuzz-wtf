import { ArrowUpRight, ExternalLink, Play, Youtube } from 'lucide-react';
import { useRef } from 'react';
import { useT } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

const TIKTOK_VIDEOS = [
  { id: '7697244126261071124', url: 'https://www.tiktok.com/@ibuzz.wtf/video/7697244126261071124' },
  { id: '7697189547775495445', url: 'https://www.tiktok.com/@ibuzz.wtf/video/7697189547775495445' },
  { id: '7696699495492406548', url: 'https://www.tiktok.com/@ibuzz.wtf/video/7696699495492406548' },
  { id: '7696686906817531157', url: 'https://www.tiktok.com/@ibuzz.wtf/video/7696686906817531157' },
];
const TIKTOK_URL = 'https://www.tiktok.com/@ibuzz.wtf';
const YOUTUBE_URL = 'https://www.youtube.com/@iBuzz-wtf';

type TikTokShowcaseProps = { owner?: boolean };

export function TikTokShowcase({ owner = false }: TikTokShowcaseProps) {
  const { lang } = useT();
  const videoScroller = useRef<HTMLDivElement>(null);
  const dragState = useRef({ active: false, startX: 0, scrollLeft: 0 });
  const text = {
    th: {
      eyebrow: owner ? 'เครื่องมือโซเชียลสำหรับเจ้าของ' : 'ติดตาม iBuzz.wtf',
      title: owner ? 'จัดการช่องทางโซเชียล' : 'วิดีโอล่าสุดจาก TikTok',
      lead: owner ? 'ดูโปรไฟล์และวิดีโอสาธารณะของ TikTok พร้อมเปิดเครื่องมือจัดการช่องทางของคุณ' : 'ดูวิดีโอและติดตาม iBuzz.wtf บน TikTok พร้อมชมช่อง YouTube ของเรา',
      tiktok: 'เปิด TikTok', youtube: 'เปิด YouTube', studio: 'TikTok Studio', youtubeStudio: 'YouTube Studio',
    },
    en: {
      eyebrow: owner ? 'OWNER SOCIAL TOOLS' : 'FOLLOW iBuzz.wtf',
      title: owner ? 'Social channel manager' : 'Latest from TikTok',
      lead: owner ? 'View your public TikTok profile and videos, with shortcuts to manage your social channels.' : 'Watch our TikTok videos, follow iBuzz.wtf, and visit our YouTube channel.',
      tiktok: 'Open TikTok', youtube: 'Open YouTube', studio: 'TikTok Studio', youtubeStudio: 'YouTube Studio',
    },
    ro: {
      eyebrow: owner ? 'INSTRUMENTE SOCIALE PENTRU PROPRIETAR' : 'URMĂREȘTE iBuzz.wtf',
      title: owner ? 'Administrare canale sociale' : 'Cele mai noi videoclipuri TikTok',
      lead: owner ? 'Vezi profilul și videoclipurile publice TikTok și accesează instrumentele de administrare.' : 'Urmărește videoclipurile iBuzz.wtf pe TikTok și vizitează canalul nostru YouTube.',
      tiktok: 'Deschide TikTok', youtube: 'Deschide YouTube', studio: 'TikTok Studio', youtubeStudio: 'YouTube Studio',
    },
  }[lang];

  return (
    <section className={owner ? 'min-w-0 space-y-5' : 'section-space min-w-0 overflow-hidden border-y border-border/25 bg-card/20'} aria-labelledby={owner ? 'owner-social-title' : 'public-social-title'}>
      <div className={owner ? 'min-w-0' : 'mx-auto w-full min-w-0 max-w-6xl px-4 sm:px-6 lg:px-8'}>
        <p className="section-eyebrow">{text.eyebrow}</p>
        <div className="mt-3 flex min-w-0 flex-col items-stretch justify-between gap-4 lg:flex-row lg:items-end">
          <div className="min-w-0 max-w-2xl">
            <h2 id={owner ? 'owner-social-title' : 'public-social-title'} className="section-heading">{text.title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{text.lead}</p>
          </div>
          <div className="grid w-full min-w-0 grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap lg:w-auto lg:justify-end [&>button]:max-w-full [&>button]:whitespace-normal">
            <Button asChild variant="glow">
              <a className="flex w-full min-w-0 items-center justify-center whitespace-normal text-center sm:w-auto" href={owner ? 'https://www.tiktok.com/creator-center' : TIKTOK_URL} target="_blank" rel="noopener noreferrer">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="mr-1 h-4 w-4 shrink-0" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.1V2h-3.55v13.67a2.9 2.9 0 0 1-2.9 2.75 2.9 2.9 0 1 1 0-5.8c.3 0 .59.05.86.13V9.13a6.5 6.5 0 1 0 5.59 6.44V8.6a8.35 8.35 0 0 0 4.88 1.57V6.64a4.84 4.84 0 0 1-1.11.05Z"/></svg>{owner ? text.studio : text.tiktok}<ArrowUpRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline">
              <a className="flex w-full min-w-0 items-center justify-center whitespace-normal text-center sm:w-auto" href={owner ? 'https://studio.youtube.com/' : YOUTUBE_URL} target="_blank" rel="noopener noreferrer">
                <Youtube className="mr-1 h-4 w-4" />{owner ? text.youtubeStudio : text.youtube}<ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
      <div
        className="mx-auto mt-8 flex w-full max-w-6xl justify-center overflow-x-auto overflow-y-hidden scroll-smooth px-3 pb-3 [touch-action:pan-x] sm:mt-10"
        ref={videoScroller}
        onWheel={(event) => {
          const el = videoScroller.current;
          if (el && el.scrollWidth > el.clientWidth && Math.abs(event.deltaY) > Math.abs(event.deltaX)) el.scrollLeft += event.deltaY;
        }}
        onPointerDown={(event) => {
          if (event.pointerType === 'mouse' && event.button === 0) {
            const el = videoScroller.current;
            if (!el) return;
            dragState.current = { active: true, startX: event.clientX, scrollLeft: el.scrollLeft };
            el.style.cursor = 'grabbing';
          }
        }}
        onPointerMove={(event) => {
          const el = videoScroller.current;
          if (el && dragState.current.active) el.scrollLeft = dragState.current.scrollLeft - (event.clientX - dragState.current.startX);
        }}
        onPointerUp={() => { dragState.current.active = false; if (videoScroller.current) videoScroller.current.style.cursor = 'grab'; }}
        onPointerCancel={() => { dragState.current.active = false; if (videoScroller.current) videoScroller.current.style.cursor = 'grab'; }}
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(34, 211, 238, 0.75) transparent', WebkitOverflowScrolling: 'touch', cursor: 'grab' }}
      >
        <div className="flex w-max min-w-0 items-start justify-center gap-3">
          {TIKTOK_VIDEOS.map((video) => (
            <div key={video.id} className="w-[172px] shrink-0 overflow-hidden rounded-xl border border-cyan-400/20 bg-transparent shadow-[0_0_18px_rgba(34,211,238,0.08)] sm:w-[192px] lg:w-[calc((100vw-10rem)/4)] lg:max-w-[260px] xl:max-w-[280px]">
              <iframe
                title={`iBuzz.wtf TikTok video ${video.id}`}
                src={`https://www.tiktok.com/player/v1/${video.id}?controls=1&description=0&music_info=0&loop=0`}
                className="block aspect-[9/16] w-full border-0 bg-transparent"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
