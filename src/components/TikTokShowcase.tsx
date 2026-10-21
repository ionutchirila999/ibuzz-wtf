const TIKTOK_VIDEOS = [
  { id: '7697244126261071124', url: 'https://www.tiktok.com/@ibuzz.wtf/video/7697244126261071124' },
  { id: '7697189547775495445', url: 'https://www.tiktok.com/@ibuzz.wtf/video/7697189547775495445' },
  { id: '7696699495492406548', url: 'https://www.tiktok.com/@ibuzz.wtf/video/7696699495492406548' },
  { id: '7696686906817531157', url: 'https://www.tiktok.com/@ibuzz.wtf/video/7696686906817531157' },
];

type TikTokShowcaseProps = { owner?: boolean };

export function TikTokShowcase(_props: TikTokShowcaseProps) {
  return (
    <section className="w-full min-w-0 overflow-hidden bg-transparent py-3" aria-label="TikTok videos">
      <div
        className="mx-auto flex w-full max-w-6xl justify-center overflow-x-auto overflow-y-hidden scroll-smooth px-3 pb-3"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(34, 211, 238, 0.75) transparent', WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex w-max min-w-0 items-start justify-center gap-3">
          {TIKTOK_VIDEOS.map((video) => (
            <div
              key={video.id}
              className="w-[172px] shrink-0 overflow-hidden rounded-xl border border-cyan-400/20 bg-transparent shadow-[0_0_18px_rgba(34,211,238,0.08)] sm:w-[192px] lg:w-[205px]"
            >
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
