import { createFileRoute, Link } from "@tanstack/react-router";
import { Cpu, Footprints, Wrench, ShieldCheck, Tag } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TechFix Marketplace — Refurbished Tech & Women's Shoes" },
      { name: "description", content: "Inspected, repaired electronics and new or pre-owned women's footwear. Enquire on WhatsApp or LINE." },
      { property: "og:title", content: "TechFix Marketplace — Refurbished Tech & Women's Shoes" },
      { property: "og:description", content: "Inspected, repaired electronics and new or pre-owned women's footwear." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <img src={hero} alt="Refurbished phone, laptop and women's sneakers" width={1536} height={864} className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="hero-fade absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-28 md:pt-44">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">Buy · Repair · Resell</p>
          <h1 className="max-w-2xl text-4xl font-bold md:text-6xl">Tech we've fixed. Shoes she'll love.</h1>
          <p className="mt-4 max-w-lg text-muted-foreground">Every device inspected and repaired by a technician before resale. A women's-only footwear corner, new and pre-owned.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="glow" size="lg"><Link to="/shop" search={{ category: "technology" }}><Cpu /> Technology</Link></Button>
            <Button asChild variant="secondary" size="lg"><Link to="/shop" search={{ category: "womens_shoes" }}><Footprints /> Women's Shoes</Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 md:grid-cols-3">
        {[
          { icon: Wrench, t: "Technician inspected", d: "Faults found and repaired before anything is listed." },
          { icon: ShieldCheck, t: "Honest listings", d: "Condition, authenticity and stock shown only when verified." },
          { icon: Tag, t: "Sell us your items", d: "Got a device or women's shoes to sell? Send us an offer." },
        ].map(({ icon: I, t, d }) => (
          <div key={t} className="rounded-xl border bg-card p-5">
            <I className="mb-3 h-6 w-6 text-primary" />
            <h3 className="font-semibold">{t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-4">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border bg-accent p-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold">Have something to sell?</h2>
            <p className="text-sm text-muted-foreground">Electronics or women's footwear — tell us about it and we'll reply.</p>
          </div>
          <Button asChild variant="glow"><Link to="/sell">Offer an item</Link></Button>
        </div>
      </section>
    </div>
  );
}
