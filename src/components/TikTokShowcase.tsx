import { useEffect } from 'react';
import { ArrowUpRight, ExternalLink, Play, Youtube } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

const TIKTOK_URL = 'https://www.tiktok.com/@ibuzz.wtf';
const YOUTUBE_URL = 'https://www.youtube.com/@iBuzz-wtf';

type TikTokShowcaseProps = { owner?: boolean };

export function TikTokShowcase({ owner = false }: TikTokShowcaseProps) {
  const { lang } = useT();

  useEffect(() => {
    // TikTok's official creator embed renders the public profile and its video grid.
    const script = document.createElement('script');
    script.src = 'https://www.tiktok.com/embed.js';
    script.async = true;
    script.dataset.ibuzzTikTokEmbed = 'true';
    document.body.appendChild(script);
    return () => { script.remove(); };
  }, []);

  const text = {
    th: {
      eyebrow: owner ? 'เครื่องมือโซเชียลสำหรับเจ้าของ' : 'ติดตาม iBuzz.wtf',
      title: owner ? 'จัดการช่องทางโซเชียล' : 'วิดีโอล่าสุดจาก TikTok',
      lead: owner ? 'ดูโปรไฟล์และวิดีโอสาธารณะของ TikTok พร้อมเปิดเครื่องมือจัดการช่องทางของคุณ' : 'ดูวิดีโอและติดตาม iBuzz.wtf บน TikTok พร้อมชมช่อง YouTube ของเรา',
      tiktok: 'เปิด TikTok', youtube: 'เปิด YouTube', studio: 'TikTok Studio', youtubeStudio: 'YouTube Studio',
      fallback: 'หากวิดีโอไม่โหลดในเบราว์เซอร์นี้ ให้เปิดโปรไฟล์ TikTok โดยตรง',
    },
    en: {
      eyebrow: owner ? 'OWNER SOCIAL TOOLS' : 'FOLLOW iBuzz.wtf',
      title: owner ? 'Social channel manager' : 'Latest from TikTok',
      lead: owner ? 'View your public TikTok profile and videos, with shortcuts to manage your social channels.' : 'Watch our TikTok videos, follow iBuzz.wtf, and visit our YouTube channel.',
      tiktok: 'Open TikTok', youtube: 'Open YouTube', studio: 'TikTok Studio', youtubeStudio: 'YouTube Studio',
      fallback: 'If videos do not load in this browser, open the TikTok profile directly.',
    },
    ro: {
      eyebrow: owner ? 'INSTRUMENTE SOCIALE PENTRU PROPRIETAR' : 'URMĂREȘTE iBuzz.wtf',
      title: owner ? 'Administrare canale sociale' : 'Cele mai noi videoclipuri TikTok',
      lead: owner ? 'Vezi profilul și videoclipurile publice TikTok și accesează instrumentele de administrare.' : 'Urmărește videoclipurile iBuzz.wtf pe TikTok și vizitează canalul nostru YouTube.',
      tiktok: 'Deschide TikTok', youtube: 'Deschide YouTube', studio: 'TikTok Studio', youtubeStudio: 'YouTube Studio',
      fallback: 'Dacă videoclipurile nu se încarcă, deschide direct profilul TikTok.',
    },
  }[lang];

  return (
    <section className={owner ? 'space-y-5' : 'section-space border-y border-border/25 bg-card/20'} aria-labelledby={owner ? 'owner-social-title' : 'public-social-title'}>
      <div className={owner ? '' : 'mx-auto max-w-6xl px-5 sm:px-8'}>
        <p className="section-eyebrow">{text.eyebrow}</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 id={owner ? 'owner-social-title' : 'public-social-title'} className="section-heading">{text.title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{text.lead}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="glow">
              <a href={owner ? 'https://www.tiktok.com/creator-center' : TIKTOK_URL} target="_blank" rel="noopener noreferrer">
                {owner ? <Play className="mr-1 h-4 w-4" /> : null}{owner ? text.studio : text.tiktok}<ArrowUpRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={owner ? 'https://studio.youtube.com/' : YOUTUBE_URL} target="_blank" rel="noopener noreferrer">
                <Youtube className="mr-1 h-4 w-4" />{owner ? text.youtubeStudio : text.youtube}<ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
        <div className="mt-6 overflow-hidden rounded-xl border border-border/40 bg-background/70 p-2 sm:p-4">
          <blockquote className="tiktok-embed" cite={TIKTOK_URL} data-unique-id="ibuzz.wtf" data-embed-type="creator" style={{ maxWidth: '780px', minWidth: '288px', margin: '0 auto' }}>
            <section><a target="_blank" rel="noopener noreferrer" href={TIKTOK_URL}>@ibuzz.wtf</a></section>
          </blockquote>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{text.fallback}</p>
      </div>
    </section>
  );
}
