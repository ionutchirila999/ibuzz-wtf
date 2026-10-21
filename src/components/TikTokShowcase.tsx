import { useEffect, useState } from 'react';

const TIKTOK_VIDEOS = [
  { id: '7697244126261071124', url: 'https://www.tiktok.com/@ibuzz.wtf/video/7697244126261071124' },
  { id: '7697189547775495445', url: 'https://www.tiktok.com/@ibuzz.wtf/video/7697189547775495445' },
  { id: '7696699495492406548', url: 'https://www.tiktok.com/@ibuzz.wtf/video/7696699495492406548' },
  { id: '7696686906817531157', url: 'https://www.tiktok.com/@ibuzz.wtf/video/7696686906817531157' },
];

type TikTokShowcaseProps = { owner?: boolean };

export function TikTokShowcase(_props: TikTokShowcaseProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.tiktok.com/embed.js';
    script.async = true;
    script.dataset['ibuzzTikTokEmbed'] = 'true';
    document.body.appendChild(script);
    return () => { script.remove(); };
  }, [refreshKey]);

  return (
    <section className="w-full min-w-0 overflow-hidden bg-transparent py-2" aria-label="TikTok videos">
      <div className="relative min-w-0">
        <div
          key={refreshKey}
          className="flex w-full min-w-0 gap-3 overflow-x-auto overflow-y-hidden scroll-smooth px-1 pb-3"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(34, 211, 238, 0.75) rgba(15, 23, 42, 0.55)', WebkitOverflowScrolling: 'touch' }}
        >
          {TIKTOK_VIDEOS.map((video) => (
            <div
              key={video.id}
              className="w-[172px] shrink-0 overflow-hidden rounded-xl border border-cyan-400/20 bg-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.08)] sm:w-[192px] lg:w-[205px] [&_blockquote]:!m-0 [&_blockquote]:!w-full [&_blockquote]:!min-w-0 [&_blockquote]:!max-w-none [&_iframe]:!max-w-none"
            >
              <blockquote
                className="tiktok-embed !m-0 !w-full !min-w-0 !max-w-none"
                cite={video.url}
                data-video-id={video.id}
                style={{ width: '100%', minWidth: 0, maxWidth: 'none', margin: 0 }}
              >
                <section>
                  <a target="_blank" rel="noopener noreferrer" href={video.url}>Watch this TikTok</a>
                </section>
              </blockquote>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
