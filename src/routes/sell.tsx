import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Sell to us — TechFix Marketplace" },
      { name: "description", content: "Offer your used electronics or women's shoes for resale. We'll inspect and reply." },
      { property: "og:title", content: "Sell to us — TechFix Marketplace" },
      { property: "og:description", content: "Offer your used electronics or women's shoes for resale." },
    ],
  }),
  component: Sell,
});

function Sell() {
  const [category, setCategory] = useState<"technology" | "womens_shoes">("technology");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name")).trim().slice(0, 100);
    const contact = String(f.get("contact")).trim().slice(0, 150);
    const item = String(f.get("item")).trim().slice(0, 2000);
    if (!name || !contact || !item) return toast.error("Please fill in name, contact and item.");
    setSending(true);
    const price = f.get("price") ? Number(f.get("price")) : null;
    const { error } = await supabase.from("resale_offers").insert({
      name, contact, category, item_description: item,
      condition_notes: String(f.get("condition") || "").slice(0, 1000) || null,
      asking_price: price && price > 0 ? price : null,
    });
    setSending(false);
    if (error) return toast.error("Couldn't send. Please try again.");
    setDone(true);
  }

  if (done) return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
      <h1 className="mt-4 text-2xl font-bold">Offer received</h1>
      <p className="mt-2 text-muted-foreground">We'll review it and contact you soon.</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-3xl font-bold">Sell your item to us</h1>
      <p className="mt-2 text-sm text-muted-foreground">We buy electronics (working or faulty) and women's footwear only.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {(["technology", "womens_shoes"] as const).map((c) => (
            <button type="button" key={c} onClick={() => setCategory(c)}
              className={`rounded-lg border p-3 text-sm ${category === c ? "border-primary bg-accent" : "text-muted-foreground"}`}>
              {c === "technology" ? "Electronics" : "Women's shoes"}
            </button>
          ))}
        </div>
        <div><Label htmlFor="name">Your name</Label><Input id="name" name="name" maxLength={100} required /></div>
        <div><Label htmlFor="contact">Phone, WhatsApp or LINE ID</Label><Input id="contact" name="contact" maxLength={150} required /></div>
        <div><Label htmlFor="item">What are you selling?</Label><Textarea id="item" name="item" maxLength={2000} required placeholder={category === "technology" ? "e.g. iPhone 13 128GB, cracked screen" : "e.g. Nike Air Max women's EU 38, worn twice"} /></div>
        <div><Label htmlFor="condition">Condition / known faults</Label><Textarea id="condition" name="condition" maxLength={1000} /></div>
        <div><Label htmlFor="price">Asking price (฿, optional)</Label><Input id="price" name="price" type="number" min="0" /></div>
        <Button type="submit" variant="glow" size="lg" className="w-full" disabled={sending}>{sending ? "Sending…" : "Send offer"}</Button>
      </form>
    </div>
  );
}
