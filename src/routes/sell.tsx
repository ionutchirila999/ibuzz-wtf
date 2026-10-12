import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/lib/i18n";
import { SHOP_NAME } from "@/lib/shop";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: `Sell to us — ${SHOP_NAME}` },
      { name: "description", content: "Offer your used phones, laptops, tablets, TVs, gaming devices, electric scooters, digital cameras or women's shoes to iBuzz.wtf. Broken smartphones and cameras welcome." },
      { property: "og:title", content: `Sell to us — ${SHOP_NAME}` },
      { property: "og:description", content: "We purchase pre-owned electronics and women's shoes. Offer your device to iBuzz.wtf — broken smartphones and digital cameras are welcome." },
    ],
  }),
  component: Sell,
});

function Sell() {
  const { t } = useT();
  const [category, setCategory] = useState<"technology" | "womens_shoes">("technology");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name")).trim().slice(0, 100);
    const contact = String(f.get("contact")).trim().slice(0, 150);
    const item = String(f.get("item")).trim().slice(0, 2000);
    if (!name || !contact || !item) { toast.error(t("sell.missing")); return; }
    setSending(true);
    const price = f.get("price") ? Number(f.get("price")) : null;
    const { error } = await supabase.from("resale_offers").insert({
      name, contact, category, item_description: item,
      condition_notes: String(f.get("condition") || "").slice(0, 1000) || null,
      asking_price: price && price > 0 ? price : null,
    });
    setSending(false);
    if (error) { toast.error(t("sell.err")); return; }
    setDone(true);
  }

  if (done) return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
      <h1 className="mt-4 text-2xl font-bold">{t("sell.doneT")}</h1>
      <p className="mt-2 text-muted-foreground">{t("sell.doneD")}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-3xl font-bold">{t("sell.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("sell.lead")}</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {(["technology", "womens_shoes"] as const).map((c) => (
            <button type="button" key={c} onClick={() => setCategory(c)}
              className={`rounded-lg border p-3 text-sm ${category === c ? "border-primary bg-accent" : "text-muted-foreground"}`}>
              {c === "technology" ? t("sell.elec") : t("sell.shoes")}
            </button>
          ))}
        </div>
        <div><Label htmlFor="name">{t("sell.name")}</Label><Input id="name" name="name" maxLength={100} required /></div>
        <div><Label htmlFor="contact">{t("sell.contact")}</Label><Input id="contact" name="contact" maxLength={150} required /></div>
        <div><Label htmlFor="item">{t("sell.item")}</Label><Textarea id="item" name="item" maxLength={2000} required placeholder={category === "technology" ? t("sell.phTech") : t("sell.phShoes")} /></div>
        <div><Label htmlFor="condition">{t("sell.cond")}</Label><Textarea id="condition" name="condition" maxLength={1000} /></div>
        <div><Label htmlFor="price">{t("sell.price")}</Label><Input id="price" name="price" type="number" min="0" /></div>
        <Button type="submit" variant="glow" size="lg" className="w-full" disabled={sending}>{sending ? t("sell.sending") : t("sell.send")}</Button>
      </form>
    </div>
  );
}
