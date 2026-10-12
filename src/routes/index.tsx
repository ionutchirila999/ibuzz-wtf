import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Cpu, Footprints, Wrench, ShoppingBag, Tag } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { SHOP_NAME } from "@/lib/shop";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${SHOP_NAME} — Buy · Repair · Resell` },
      { name: "description", content: "Buy smart, repair better, and resell with confidence. Shop inspected technology and women's shoes, or offer your pre-owned electronics to M&W." },
      { property: "og:title", content: `${SHOP_NAME} — Buy · Repair · Resell` },
      { property: "og:description", content: "We buy pre-owned electronics, professionally repair and test devices, and resell quality technology alongside curated women's shoes." },
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
        <div className="relative mx-auto max-w-6xl px-5 pb-32 pt-8 text-center sm:px-8 sm:pb-44 sm:pt-12 md:pb-48 md:pt-16">
          <p className="mb-4 text-xs font-bold text-primary-soft sm:text-sm">{t("home.kicker")}</p>
          <h1 id="home-headline" className="mx-auto max-w-[850px] text-balance text-[32px] font-bold leading-[1.16] sm:text-5xl md:text-[56px]">{t("home.title")}</h1>
          <p className="mx-auto mt-5 max-w-[720px] text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-7">{t("home.lead")}</p>
          <div className="mx-auto mt-6 grid max-w-xl grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2">
            <Button asChild variant="glow" size="lg" className="h-auto min-h-12 w-full whitespace-normal px-4 py-3 text-sm sm:text-base"><Link to="/shop" search={{ category: "technology" }}><Cpu aria-hidden="true" /><span className="min-w-0">{t("home.exploreTech")}</span><ArrowUpRight aria-hidden="true" className="ml-auto" /></Link></Button>
            <Button asChild variant="secondary" size="lg" className="h-auto min-h-12 w-full whitespace-normal px-4 py-3 text-sm sm:text-base"><Link to="/shop" search={{ category: "womens_shoes" }}><Footprints aria-hidden="true" /><span className="min-w-0">{t("home.shopShoes")}</span><ArrowUpRight aria-hidden="true" className="ml-auto" /></Link></Button>
          </div>
          <Button asChild variant="outline" className="mt-4 h-auto min-h-11 max-w-full whitespace-normal px-5 py-2.5 text-sm"><Link to="/sell"><Tag aria-hidden="true" /><span>{t("home.sellDevice")}</span><ArrowUpRight aria-hidden="true" /></Link></Button>
        </div>
      </section>

      <section aria-label={t("home.kicker")} className="mx-auto grid max-w-6xl gap-6 border-y px-5 py-7 sm:px-8 md:grid-cols-3 md:gap-8">
        {[
          { icon: ShoppingBag, t: t("home.f1t"), d: t("home.f1d") },
          { icon: Wrench, t: t("home.f2t"), d: t("home.f2d") },
          { icon: Tag, t: t("home.f3t"), d: t("home.f3d") },
        ].map(({ icon: I, t: title, d }) => (
          <div key={title} className="min-w-0">
            <div className="mb-2 flex items-center gap-3"><I aria-hidden="true" className="h-5 w-5 shrink-0 text-primary-soft" /><h2 className="text-base font-semibold">{title}</h2></div>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-4">
        <div className="flex flex-col items-start justify-between gap-5 border-b pb-8 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold">{t("home.ctaT")}</h2>
            <p className="text-sm text-muted-foreground">{t("home.ctaD")}</p>
          </div>
          <Button asChild variant="glow" className="h-auto min-h-11 shrink-0 whitespace-normal py-3"><Link to="/sell"><Tag aria-hidden="true" />{t("home.sellDevice")}<ArrowUpRight aria-hidden="true" /></Link></Button>
        </div>
      </section>
    </div>
  );
}
