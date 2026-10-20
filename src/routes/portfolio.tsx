import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowUpRight, Code2, MonitorSmartphone, ShoppingBag, Wrench } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { copy, pageHead } from '@/lib/service-copy';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/portfolio')({
  staticData: { sitemap: true },
  head: () => pageHead('Portfolio', 'Website design and development portfolio by iBuzz.wtf, featuring the iBuzz.wtf multilingual storefront.'),
  component: Portfolio,
});

function Portfolio() {
  const { lang } = useT();
  const text = {
    th: {
      featured: 'ผลงานเด่น',
      title: 'iBuzz.wtf — เว็บไซต์ธุรกิจและร้านค้าออนไลน์',
      intro: 'ออกแบบและพัฒนาเว็บไซต์ของ iBuzz.wtf เอง รวมบริการซ่อมอุปกรณ์ งานดิจิทัล และตลาดสินค้าไว้ในประสบการณ์เดียว',
      visit: 'เยี่ยมชมเว็บไซต์จริง',
      services: 'ดูบริการพัฒนาเว็บไซต์',
      about: 'เกี่ยวกับโปรเจกต์',
      details: 'เว็บไซต์หลายภาษา รองรับภาษาไทย อังกฤษ และโรมาเนีย พร้อมหน้าร้านออนไลน์ ระบบค้นหาและกรองสินค้า หน้ารายละเอียดสินค้า และช่องทางติดต่อสำหรับบริการซ่อมและงานดิจิทัล',
      features: ['ภาษาไทย · English · Română', 'ตลาดสินค้าและตัวกรอง', 'บริการซ่อมและงานดิจิทัล', 'ออกแบบให้รองรับมือถือ'],
      scope: 'ขอบเขตงาน',
      scopeText: 'ออกแบบ UI, พัฒนาเว็บไซต์, รองรับหลายภาษา และจัดโครงสร้างหน้าร้าน',
      live: 'เว็บไซต์ใช้งานจริง',
    },
    en: {
      featured: 'FEATURED PROJECT',
      title: 'iBuzz.wtf — Business Website & Online Store',
      intro: 'Designed and developed the iBuzz.wtf website to bring device repair, digital services, and an online marketplace together in one experience.',
      visit: 'Visit live website',
      services: 'Discuss a website project',
      about: 'About the project',
      details: 'A multilingual website in Thai, English, and Romanian, with an online storefront, product search and filters, product detail pages, and clear contact paths for repair and digital services.',
      features: ['Thai · English · Romanian', 'Product marketplace and filters', 'Repair and digital service pages', 'Responsive mobile-first layout'],
      scope: 'PROJECT SCOPE',
      scopeText: 'UI design, website development, multilingual experience, and storefront structure.',
      live: 'Live website',
    },
    ro: {
      featured: 'PROIECT REPREZENTATIV',
      title: 'iBuzz.wtf — Site de prezentare și magazin online',
      intro: 'Am proiectat și dezvoltat site-ul iBuzz.wtf, reunind reparațiile dispozitivelor, serviciile digitale și un marketplace într-o singură experiență.',
      visit: 'Vizitează site-ul',
      services: 'Discută un proiect web',
      about: 'Despre proiect',
      details: 'Site multilingv în română, engleză și thailandeză, cu magazin online, căutare și filtre pentru produse, pagini de detalii și acces rapid la serviciile de reparații și digitale.',
      features: ['Română · English · ไทย', 'Marketplace cu filtre pentru produse', 'Pagini pentru reparații și servicii digitale', 'Design adaptat pentru mobil'],
      scope: 'DOMENIUL PROIECTULUI',
      scopeText: 'Design UI, dezvoltare web, experiență multilingvă și structurarea magazinului.',
      live: 'Site activ',
    },
  }[lang];

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="section-eyebrow">iBuzz.wtf Digital</p>
      <h1 className="section-heading mt-3">{copy(lang, 'portfolio')}</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">{copy(lang, 'portfolioLead')}</p>

      <article className="mt-10 overflow-hidden rounded-2xl border border-border/50 bg-card/40">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative flex min-h-64 flex-col justify-between overflow-hidden border-b border-border/30 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white sm:p-9 lg:border-b-0 lg:border-r">
            <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full border border-cyan-300/20" />
            <div className="absolute -right-4 -top-8 h-40 w-40 rounded-full border border-cyan-300/20" />
            <div className="relative flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">{text.featured}</span>
              <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">{text.live}</span>
            </div>
            <div className="relative mt-12">
              <div className="mb-4 flex items-center gap-2 text-2xl font-black tracking-tight"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300 text-slate-950">iB</span> iBuzz<span className="text-cyan-300">.wtf</span></div>
              <p className="max-w-md text-sm leading-6 text-slate-300">{text.intro}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {['TH', 'EN', 'RO'].map((code) => <span key={code} className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold">{code}</span>)}
              </div>
            </div>
            <div className="relative mt-10 grid grid-cols-3 gap-2 border-t border-white/15 pt-4 text-xs text-slate-300">
              <span className="flex items-center gap-2"><Wrench className="h-4 w-4 text-cyan-300" />{lang === 'th' ? 'ซ่อม' : lang === 'ro' ? 'Reparații' : 'Repair'}</span>
              <span className="flex items-center gap-2"><Code2 className="h-4 w-4 text-cyan-300" />Digital</span>
              <span className="flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-cyan-300" />{lang === 'th' ? 'ตลาด' : lang === 'ro' ? 'Magazin' : 'Market'}</span>
            </div>
          </div>

          <div className="flex flex-col p-6 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-soft">{text.about}</p>
            <h2 className="mt-3 text-2xl font-bold leading-tight">{text.title}</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">{text.details}</p>
            <ul className="mt-6 grid gap-3">
              {text.features.map((feature, index) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary-soft">{index + 1}</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 border-t border-border/30 pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{text.scope}</p>
              <p className="mt-2 text-sm text-muted-foreground">{text.scopeText}</p>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild variant="glow">
                <a href="https://ibuzz.wtf" target="_blank" rel="noopener noreferrer">{text.visit}<ArrowUpRight className="ml-1 h-4 w-4" /></a>
              </Button>
              <Button asChild variant="outline">
                <Link to="/digital">{text.services}<MonitorSmartphone className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
