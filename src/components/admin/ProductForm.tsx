import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SUBCATEGORIES, SIZE_SYSTEMS, legacyCategory, legacyCondition, calcProfit, formatPrice, type Category, type Product } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Form = Omit<Product, "id" | "created_at" | "updated_at">;
const COSTS = ["purchase_cost", "repair_cost", "shipping_cost", "platform_fees", "other_expenses"] as const;
type Costs = Record<(typeof COSTS)[number], number> & { fault_notes: string };

const empty: Form = {
  market_category: "technology", market_condition: "pre_owned", audience: "all", category: "technology", subcategory: SUBCATEGORIES.technology[0] ?? "", title: "", brand: "", model: "", description: "",
  images: [], price: 0, negotiable: false, stock: 1, condition: "pre_owned", shoe_size: "", size_system: "EU",
  color: "", material: "", authenticity_verified: false, authenticity_notes: "", delivery_options: "", return_policy: "",
  is_demo: false, status: "available",
};

export function ProductForm({ product, onDone }: { product: Product | null; onDone: () => void }) {
  const [f, setF] = useState<Form>(product ? { ...product } : empty);
  const [c, setC] = useState<Costs>({ purchase_cost: 0, repair_cost: 0, shipping_cost: 0, platform_fees: 0, other_expenses: 0, fault_notes: "" });
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!product) return;
    supabase.from("product_costs").select("*").eq("product_id", product.id).maybeSingle().then(({ data }) => {
      if (data) setC({ ...data, fault_notes: data.fault_notes ?? "" });
    });
  }, [product]);

  async function upload(files: FileList | null) {
    if (!files) return;
    setBusy(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-z0-9.]/gi, "_")}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) { toast.error(error.message); continue; }
      const { data } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (data) urls.push(data.signedUrl);
    }
    set("images", [...f.images, ...urls]);
    setBusy(false);
  }

  async function save() {
    if (!f.title.trim()) { toast.error("Title is required"); return; }
    setBusy(true);
    const payload = { ...f, category: legacyCategory(f.market_category as Category), condition: legacyCondition(f.market_condition), shoe_size: f.market_category !== "technology" ? f.shoe_size : null, size_system: f.market_category !== "technology" ? f.size_system : null };
    const res = product
      ? await supabase.from("products").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", product.id).select().single()
      : await supabase.from("products").insert(payload).select().single();
    if (res.error) { setBusy(false); { toast.error(res.error.message); return; } }
    const { error } = await supabase.from("product_costs").upsert({ product_id: res.data.id, ...c, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    onDone();
  }

  const profit = calcProfit({ sellingPrice: Number(f.price), purchaseCost: c.purchase_cost, repairCost: c.repair_cost, shipping: c.shipping_cost, platformFees: c.platform_fees, otherExpenses: c.other_expenses });
  const shoes = f.market_category !== "technology";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Category</Label>
          <Select value={f.market_category} onValueChange={(v) => setF((p) => ({ ...p, market_category: v, subcategory: SUBCATEGORIES[v as Category][0] ?? "" }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="technology">Technology</SelectItem><SelectItem value="clothing">Clothing</SelectItem><SelectItem value="footwear">Footwear</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Type</Label>
          <Select value={f.subcategory} onValueChange={(v) => set("subcategory", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{SUBCATEGORIES[f.market_category as Category].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>For</Label><Select value={f.audience} onValueChange={v=>set("audience",v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{["all","men","women","children"].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
      <div><Label>Title</Label><Input value={f.title} onChange={(e) => set("title", e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Brand</Label><Input value={f.brand ?? ""} onChange={(e) => set("brand", e.target.value)} /></div>
        <div><Label>Model</Label><Input value={f.model ?? ""} onChange={(e) => set("model", e.target.value)} /></div>
        {shoes && <>
          <div><Label>Size</Label><Input value={f.shoe_size ?? ""} onChange={(e) => set("shoe_size", e.target.value)} /></div>
          <div><Label>Sizing system</Label>
            <Select value={f.size_system ?? "EU"} onValueChange={(v) => set("size_system", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SIZE_SYSTEMS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </>}
        <div><Label>Color</Label><Input value={f.color ?? ""} onChange={(e) => set("color", e.target.value)} /></div>
        <div><Label>Material</Label><Input value={f.material ?? ""} onChange={(e) => set("material", e.target.value)} /></div>
        <div><Label>Condition</Label>
          <Select value={f.market_condition} onValueChange={(v) => set("market_condition", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="new">New</SelectItem><SelectItem value="pre_owned">Pre-owned</SelectItem><SelectItem value="refurbished">Refurbished</SelectItem><SelectItem value="repaired_tested">Repaired & tested</SelectItem><SelectItem value="untested">Untested</SelectItem><SelectItem value="for_parts">For parts</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Stock</Label><Input type="number" min={0} value={f.stock} onChange={(e) => set("stock", Number(e.target.value))} /></div>
        <div><Label>Selling price (฿)</Label><Input type="number" min={0} value={f.price} onChange={(e) => set("price", Number(e.target.value))} /></div>
        <label className="flex items-end gap-2 pb-2 text-sm"><Switch checked={f.negotiable} onCheckedChange={(v) => set("negotiable", v)} /> Negotiable</label>
      </div>
      <div><Label>Description</Label><Textarea value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} /></div>

      <div>
        <Label>Photos</Label>
        <div className="mt-1 flex flex-wrap gap-2">
          {f.images.map((src) => (
            <div key={src} className="relative h-20 w-20 overflow-hidden rounded-md border">
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button onClick={() => set("images", f.images.filter((x) => x !== src))} className="absolute right-0.5 top-0.5 rounded-full bg-background/80 p-0.5"><X className="h-3 w-3" /></button>
            </div>
          ))}
          <label className="grid h-20 w-20 cursor-pointer place-items-center rounded-md border border-dashed text-muted-foreground">
            <Upload className="h-5 w-5" /><input type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
          </label>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm"><Switch checked={f.authenticity_verified} onCheckedChange={(v) => set("authenticity_verified", v)} /> Authenticity verified by me</label>
      {f.authenticity_verified && <Input placeholder="How it was verified" value={f.authenticity_notes ?? ""} onChange={(e) => set("authenticity_notes", e.target.value)} />}
      <div><Label>Delivery options</Label><Input value={f.delivery_options ?? ""} onChange={(e) => set("delivery_options", e.target.value)} /></div>
      <div><Label>Return policy</Label><Input value={f.return_policy ?? ""} onChange={(e) => set("return_policy", e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Status</Label>
          <Select value={f.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="available">Available</SelectItem><SelectItem value="sold">Sold</SelectItem><SelectItem value="hidden">Hidden</SelectItem></SelectContent>
          </Select>
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm"><Switch checked={f.is_demo} onCheckedChange={(v) => set("is_demo", v)} /> Demo listing (not real stock)</label>
      </div>

      <div className="rounded-xl border bg-muted p-4">
        <p className="mb-3 text-sm font-semibold">Private costs — never shown to customers</p>
        <div className="grid grid-cols-2 gap-3">
          {COSTS.map((k) => (
            <div key={k}><Label className="capitalize">{k.replace("_", " ")} (฿)</Label>
              <Input type="number" min={0} value={c[k]} onChange={(e) => setC((p) => ({ ...p, [k]: Number(e.target.value) }))} /></div>
          ))}
        </div>
        <Textarea className="mt-3" placeholder="Faults found / repairs done" value={c.fault_notes} onChange={(e) => setC((p) => ({ ...p, fault_notes: e.target.value }))} />
        <p className={`mt-3 text-sm font-semibold ${profit.netProfit > 0 ? "text-success" : "text-destructive"}`}>
          Net profit {formatPrice(profit.netProfit)} · {profit.margin.toFixed(1)}% margin
        </p>
        {profit.warning && <p className="text-xs text-warning">{profit.warning}</p>}
      </div>

      <Button variant="glow" className="w-full" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save listing"}</Button>
    </div>
  );
}
