import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowUpRight, ArrowRight, Wrench, Code2, ShoppingBag, ScanLine, ClipboardCheck, Monitor, FileCheck2, Smartphone, Camera } from 'lucide-react';
import hero from '@/assets/ibuzz-studio.jpg';
import heroAlt from '@/assets/hero.jpg';
import { useEffect, useRef, useState } from 'react';

// Hero background carousel using existing photos only. Slide 2 keeps the current
// background because no separate repair photo has been uploaded.
const SLIDES = [
  { src: hero },
  { src: hero, to: '/repair' as const, label: { th: 'ซ่อมและรีเฟอร์บิชอุปกรณ์อิเล็กทรอนิกส์', en: 'Electronics repair & refurbishment', ro: 'Reparații și recondiționare electronice' } },
  { src: heroAlt, to: '/shop' as const, label: { th: 'อิเล็กทรอนิกส์ กล้อง เสื้อผ้า และรองเท้า', en: 'Electronics, cameras, clothing & shoes', ro: 'Electronice, camere, haine și încălțăminte' } },
];
const DOT = { th: 'สไลด์', en: 'Slide', ro: 'Slide' };
function HeroSlides() {
  const { lang } = useT();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const section = ref.current?.parentElement;
    const stop = () => setPaused(true);
    section?.addEventListener('pointerdown', stop);
    section?.addEventListener('focusin', stop);
    return () => { section?.removeEventListener('pointerdown', stop); section?.removeEventListener('focusin', stop); };
  }, []);
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % SLIDES.length), 6000);
    return () => window.clearInterval(id);
  }, [paused]);
  const cur = SLIDES[i];
  return <>
    <div ref={ref} className="hero-slides" aria-hidden="true">{SLIDES.map((sl, n) => <div key={n} className="hero-slide" style={{ backgroundImage: `url("${sl.src}")`, opacity: n === i ? 1 : 0 }} />)}</div>
    <div className="hero-dots mx-auto flex max-w-6xl items-center gap-3 px-5 pb-4 sm:px-8">
      <div className="flex gap-1.5">{SLIDES.map((_, n) => <button key={n} type="button" aria-label={`${DOT[lang]} ${n + 1}`} aria-current={n === i} onClick={() => { setPaused(true); setI(n); }} className={`h-1.5 rounded-full transition-all ${n === i ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/50'}`} />)}</div>
      {cur.to && cur.label && <Link to={cur.to} className="truncate text-xs text-primary-soft hover:underline">{cur.label[lang]} →</Link>}
    </div>
  </>;
}

import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n';
import { copy, pageHead } from '@/lib/service-copy';
import { homeCopy } from '@/lib/home-copy';
import { MarketPreview, previewQuery } from '@/components/MarketPreview';
export const Route=createFileRoute('/')({staticData: { sitemap: true },head:()=>pageHead('Phone & Electronics Repair, Web Development & Market','Smartphone, camera and electronics repairs, custom websites and digital solutions, plus a Market of tech, clothing and footwear — and we buy broken devices.'),loader:({context})=>{void context.queryClient.prefetchQuery(previewQuery);},component:Home,errorComponent:()=> <div className="px-5 py-16 text-center"><Link to="/shop">iBuzz.wtf Market →</Link></div>,notFoundComponent:()=> <div className="px-5 py-16">iBuzz.wtf — Page not found</div>});
function Home(){const {lang}=useT();const c=(k:Parameters<typeof copy>[1])=>copy(lang,k);const h=(k:Parameters<typeof homeCopy>[1])=>homeCopy(lang,k);return <div>
 <section className="premium-hero border-b border-border/20"><div className="mx-auto grid max-w-6xl items-center gap-8 px-5 pb-7 pt-9 sm:px-8 sm:py-12 lg:grid-cols-[1.08fr_1fr] lg:gap-10 lg:py-20"><div className="min-w-0"><p className="section-eyebrow text-xs">iBuzz.wtf <span className="mx-1 text-muted-foreground">|</span> TECH • DIGITAL • MARKET</p><h1 className="hero-heading mt-5 max-w-xl text-pretty font-bold">{h('headline')}</h1><p className="mt-5 max-w-xl text-pretty text-[15px] leading-7 text-muted-foreground sm:text-base">{h('lead')}</p><div className="mt-6 grid gap-3 min-[420px]:grid-cols-2"><Button asChild variant="glow" size="lg" className="min-h-12 h-auto whitespace-normal py-3"><Link to="/repair"><Wrench className="shrink-0"/>{c('book')}<ArrowUpRight className="shrink-0"/></Link></Button><Button asChild variant="secondary" size="lg" className="min-h-12 h-auto whitespace-normal py-3"><Link to="/shop"><ShoppingBag className="shrink-0"/>{h('explore')}<ArrowUpRight className="shrink-0"/></Link></Button></div><Button asChild variant="link" className="mt-3 h-auto max-w-full justify-start whitespace-normal px-0 py-2 text-sm text-primary-soft"><Link to="/sell">{h('sellLink')}<ArrowRight className="shrink-0"/></Link></Button></div><div className="relative min-w-0"><img src={hero} alt="Electronics repair tools, smartphones, laptop, digital camera and footwear" width={1536} height={1024} fetchPriority="high" className="hero-studio w-full object-cover"/><div className="mt-3 flex justify-between border-t border-border/25 pt-3 text-[10px] font-medium text-muted-foreground sm:text-xs"><span>01 / {c('repair')}</span><span>02 / {c('digital')}</span><span>03 / {c('market')}</span></div></div></div><HeroSlides /></section>
 <MarketPreview/>
 <section className="section-space mx-auto max-w-6xl px-5 sm:px-8" aria-labelledby="services-title"><p className="section-eyebrow">iBuzz.wtf / {c('tagline')}</p><h2 id="services-title" className="section-heading mt-3">{h('help')}</h2><div className="mt-7 grid gap-4 md:grid-cols-3">{([{kind:'repair',icon:Wrench,action:'repairs',to:'/repair'},{kind:'digital',icon:Code2,action:'services',to:'/digital'},{kind:'market',icon:ShoppingBag,action:'products',to:'/shop'}] as const).map(({kind,icon:Icon,action,to},i)=><article key={kind} className="service-card flex min-w-0 flex-col rounded-lg border border-border/40 p-6"><div className="flex items-center justify-between"><Icon className="h-7 w-7 text-azure"/><span className="text-xs text-muted-foreground">0{i+1}</span></div><h3 className="mt-6 text-lg font-bold uppercase">{c(kind)}</h3><p className="mb-6 mt-3 text-sm leading-6 text-muted-foreground">{h(kind)}</p><Button asChild variant="ghost" className="mt-auto h-auto justify-between whitespace-normal border-t border-border/30 px-0 py-3 text-primary-soft"><Link to={to}>{kind==='market'?c('shop'):h(action)}<ArrowUpRight className="shrink-0"/></Link></Button></article>)}</div></section>
 <section className="buying-band border-y border-border/30"><div className="mx-auto grid max-w-6xl items-center gap-6 px-5 py-10 sm:px-8 md:grid-cols-[1fr_auto]"><div><div className="mb-5 flex gap-3 text-azure"><Smartphone className="h-6 w-6"/><Camera className="h-6 w-6"/></div><h2 className="section-heading">{h('broken')}</h2><p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground">{h('buyLead')}</p><p className="mt-3 max-w-xl text-xs leading-5 text-muted-foreground">{c('assessment')}</p></div><Button asChild variant="glow" size="lg" className="h-auto min-h-12 whitespace-normal md:max-w-64"><Link to="/sell">{c('sell')}<ArrowUpRight className="shrink-0"/></Link></Button></div></section>
 <section className="border-t border-border/25 bg-card/20"><div className="section-space mx-auto max-w-6xl px-5 sm:px-8"><p className="section-eyebrow">{h('approach')}</p><h2 className="section-heading mt-3">{h('trust')}</h2><div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{([{key:'diagnostics',icon:ScanLine},{key:'honest',icon:ClipboardCheck},{key:'needs',icon:Monitor},{key:'quotes',icon:FileCheck2}] as const).map(({key,icon:Icon})=><div key={key} className="border-t border-border/40 pt-5"><Icon className="h-6 w-6 text-azure"/><p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">{h(key)}</p></div>)}</div><div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border/25 pt-7"><div><h3 className="text-lg font-bold">{c('portfolio')}</h3><p className="mt-2 text-sm text-muted-foreground">{c('portfolioEmpty')}</p></div><Button asChild variant="outline"><Link to="/portfolio">{c('portfolio')}<ArrowUpRight/></Link></Button></div></div></section>
 </div>;}
