import { createFileRoute, Link } from "@tanstack/react-router";
import { Cpu, Footprints, Wrench, ShieldCheck, Tag } from "lucide-react";
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
    ],
  }),
  component: Home,
});

function Home() {
  const { t } = useT();
  return (
    <div>
      <section className="relative overflow-hidden">
        <img src={hero} alt="Refurbished phone, laptop and women's sneakers" width={1536} height={864} className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="hero-aura absolute inset-0" />
        <div className="hero-fade absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-28 md:pt-44">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">{t("home.kicker")}</p>
          <h1 className="max-w-2xl text-4xl font-bold md:text-6xl">{t("home.title")}</h1>
          <p className="mt-4 max-w-lg text-muted-foreground">{t("home.lead")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="glow" size="lg"><Link to="/shop" search={{ category: "technology" }}><Cpu /> {t("cat.technology")}</Link></Button>
            <Button asChild variant="secondary" size="lg"><Link to="/shop" search={{ category: "womens_shoes" }}><Footprints /> {t("cat.womens_shoes")}</Link></Button>
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
