import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Cpu, Footprints, Wrench, ShieldCheck, Tag } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { SHOP_NAME } from "@/lib/shop";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${SHOP_NAME} — Refurbished Tech & Women's Shoes` },
      { name: "description", content: "We buy broken smartphones and digital cameras, repair them, and resell inspected tech and women's footwear. Enquire on WhatsApp or LINE." },
      { property: "og:title", content: `${SHOP_NAME} — Refurbished Tech & Women's Shoes` },
      { property: "og:description", content: "We buy broken smartphones and digital cameras, repair them, and resell inspected tech and women's footwear." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { t } = useT();
  return (
    <div>
      <section className="home-hero relative isolate overflow-hidden bg-background" aria-labelledby="home-headline">
        <img src={hero} alt="Refurbished smartphone and laptop alongside women's sneakers" width={1536} height={864} fetchPriority="high" className="absolute inset-x-0 bottom-0 h-64 w-full object-cover object-center sm:h-96 md:h-[440px]" />
        <div className="home-hero-shade absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-5 pb-48 pt-8 text-center sm:px-8 sm:pb-64 sm:pt-12 md:pb-72 md:pt-16">
          <p className="mb-4 text-xs font-bold text-primary-soft sm:text-sm">{t("home.kicker")}</p>
          <h1 id="home-headline" className="mx-auto max-w-[850px] text-balance text-[32px] font-bold leading-[1.16] sm:text-5xl md:text-[56px]">{t("home.title")}</h1>
          <p className="mx-auto mt-5 max-w-[720px] text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-7">{t("home.lead")}</p>
          <div className="mx-auto mt-6 grid max-w-xl grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2">
            <Button asChild variant="glow" size="lg" className="h-auto min-h-12 w-full whitespace-normal px-4 py-3 text-sm sm:text-base"><Link to="/shop" search={{ category: "technology" }}><Cpu aria-hidden="true" /><span className="min-w-0">{t("home.exploreTech")}</span><ArrowUpRight aria-hidden="true" className="ml-auto" /></Link></Button>
            <Button asChild variant="secondary" size="lg" className="h-auto min-h-12 w-full whitespace-normal px-4 py-3 text-sm sm:text-base"><Link to="/shop" search={{ category: "womens_shoes" }}><Footprints aria-hidden="true" /><span className="min-w-0">{t("home.shopShoes")}</span><ArrowUpRight aria-hidden="true" className="ml-auto" /></Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 md:grid-cols-3">
        {[
          { icon: Wrench, t: t("home.f1t"), d: t("home.f1d") },
          { icon: ShieldCheck, t: t("home.f2t"), d: t("home.f2d") },
          { icon: Tag, t: t("home.f3t"), d: t("home.f3d") },
        ].map(({ icon: I, t: title, d }) => (
          <div key={title} className="rounded-xl border bg-card p-5">
            <I className="mb-3 h-6 w-6 text-primary" />
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-4">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border bg-accent p-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold">{t("home.ctaT")}</h2>
            <p className="text-sm text-muted-foreground">{t("home.ctaD")}</p>
          </div>
          <Button asChild variant="glow"><Link to="/sell">{t("home.ctaB")}</Link></Button>
        </div>
      </section>
    </div>
  );
}
