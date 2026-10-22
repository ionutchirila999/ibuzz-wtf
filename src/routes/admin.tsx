import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CheckCheck, LogOut, LayoutDashboard, Package, ShoppingBag, Handshake, Wrench, Calculator, Warehouse, LifeBuoy, ClipboardCheck, Wallet, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { useT } from "@/lib/i18n";
import { CATEGORY_LABEL, formatPrice, SHOP_NAME, type Category, type Product } from "@/lib/shop";
import { ProductForm } from "@/components/admin/ProductForm";
import { OwnerEnquiries, OfferPhotos } from "@/components/admin/OwnerEnquiries";
import { OwnerOrders } from "@/components/admin/OwnerOrders";
import { ProfitCalculator } from "@/components/admin/ProfitCalculator";
import { AdminOperations } from "@/components/admin/AdminOperations";
import { AdminPromotions } from "@/components/admin/AdminPromotions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/admin")({staticData: { sitemap: "exclude-subtree" },
  ssr: false,
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: `Owner dashboard — ${SHOP_NAME}` },
      { name: "description", content: "Manage listings, resale offers and profit." },
      { property: "og:title", content: `Owner dashboard — ${SHOP_NAME}` },
      { property: "og:description", content: "Manage listings, resale offers and profit." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { user, isAdmin, loading } = useAdmin();
  if (loading) return <p className="p-8 text-muted-foreground">Loading…</p>;
  if (!user) return (
    <div className="p-12 text-center"><p className="mb-4">Owner area.</p><Button asChild variant="glow"><Link to="/auth">Sign in</Link></Button></div>
  );
  if (!isAdmin) return <div className="p-12 text-center text-muted-foreground">This account doesn't have owner access.</div>;
  return <Dashboard />;
}

function Dashboard() {
  const { lang } = useT();
  const tabLabels = lang === "th" ? { overview:"ภาพรวม", inventory:"สต็อก", repairs:"งานซ่อม", support:"ช่วยเหลือลูกค้า", audit:"บันทึกตรวจสอบ", finance:"กำไรและค่าใช้จ่าย", promotions:"โปรโมชันและเว็บไซต์" } : lang === "ro" ? { overview:"Prezentare", inventory:"Inventar", repairs:"Reparații", support:"Asistență", audit:"Audit", finance:"Profit și cheltuieli", promotions:"Promoții și site" } : { overview:"Overview", inventory:"Inventory", repairs:"Repairs", support:"Support", audit:"Audit", finance:"Profit & expenses", promotions:"Promotions & website" };
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);

  const products = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const [{ data, error }, { data: costs, error: cErr }] = await Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("product_costs").select("*"),
      ]);
      if (error) throw error;
      if (cErr) throw cErr;
      const byId = new Map((costs ?? []).map((c) => [c.product_id, c]));
      return (data ?? []).map((p) => ({ ...p, product_costs: byId.get(p.id) ?? null }));
    },
  });
  const offers = useQuery({
    queryKey: ["admin-offers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("resale_offers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); qc.invalidateQueries({ queryKey: ["products"] }); };

  async function markSold(p: Product) {
    const { error } = await supabase.from("products").update({ status: "sold", stock: 0 }).eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    refresh();
  }
  async function remove(p: Product) {
    if (!confirm(`Delete "${p.title}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    refresh();
  }
  async function setOffer(id: string, status: string) {
    await supabase.from("resale_offers").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-offers"] });
  }

  const rows = products.data ?? [];


  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Owner dashboard</h1>
        <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}><LogOut /> Sign out</Button>
      </div>
      <div className="mb-6 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
        <Stat label="Available listings" value={String(rows.filter((p) => p.status === "available").length)} />
        <Stat label="Sold listings" value={String(rows.filter((p) => p.status === "sold").length)} />
      </div>
      <Tabs defaultValue="overview">
        <div className="mt-5 grid min-w-0 items-start gap-4 md:grid-cols-[210px_minmax(0,1fr)] lg:grid-cols-[232px_minmax(0,1fr)]">
        <aside className="h-fit min-w-0 rounded-xl border border-border/60 bg-card/60 p-2 md:sticky md:top-24 md:p-3">
          <div className="px-3 py-3"><p className="text-xs font-semibold tracking-wide text-muted-foreground">{lang === "th" ? "การจัดการร้าน" : lang === "ro" ? "ADMINISTRARE MAGAZIN" : "STORE MANAGEMENT"}</p></div>
        <TabsList className="grid h-auto w-full grid-cols-2 items-stretch justify-start gap-1 bg-transparent p-0 md:flex md:flex-col md:items-stretch md:rounded-lg md:bg-transparent">
          <TabsTrigger className="w-full justify-start gap-2 text-left" value="overview"><LayoutDashboard className="h-4 w-4 shrink-0"/><span>{tabLabels.overview}</span></TabsTrigger>
          <TabsTrigger className="w-full justify-start gap-2 text-left" value="listings"><Package className="h-4 w-4 shrink-0"/><span>Listings</span></TabsTrigger>
          <TabsTrigger className="w-full justify-start gap-2 text-left" value="orders"><ShoppingBag className="h-4 w-4 shrink-0"/><span>Orders</span></TabsTrigger>
          <TabsTrigger className="w-full justify-start gap-2 text-left" value="offers"><Handshake className="h-4 w-4 shrink-0"/><span>Offers {offers.data?.filter((o) => o.status === "new").length ? `(${offers.data.filter((o) => o.status === "new").length})` : ""}</span></TabsTrigger>
          <TabsTrigger className="w-full justify-start gap-2 text-left" value="enquiries"><LifeBuoy className="h-4 w-4 shrink-0"/><span>Service enquiries</span></TabsTrigger>
          <TabsTrigger className="w-full justify-start gap-2 text-left" value="calc"><Calculator className="h-4 w-4 shrink-0"/><span>Profit calculator</span></TabsTrigger>
          <TabsTrigger className="w-full justify-start gap-2 text-left" value="inventory"><Warehouse className="h-4 w-4 shrink-0"/><span>{tabLabels.inventory}</span></TabsTrigger>
          <TabsTrigger className="w-full justify-start gap-2 text-left" value="repairs"><Wrench className="h-4 w-4 shrink-0"/><span>{tabLabels.repairs}</span></TabsTrigger>
          <TabsTrigger className="w-full justify-start gap-2 text-left" value="support"><LifeBuoy className="h-4 w-4 shrink-0"/><span>{tabLabels.support}</span></TabsTrigger>
          <TabsTrigger className="w-full justify-start gap-2 text-left" value="audit"><ClipboardCheck className="h-4 w-4 shrink-0"/><span>{tabLabels.audit}</span></TabsTrigger>
          <TabsTrigger className="w-full justify-start gap-2 text-left" value="finance"><Wallet className="h-4 w-4 shrink-0"/><span>{tabLabels.finance}</span></TabsTrigger>
          <TabsTrigger className="w-full justify-start gap-2 text-left" value="promotions"><Megaphone className="h-4 w-4 shrink-0"/><span>{tabLabels.promotions}</span></TabsTrigger>
        </TabsList>
        </aside>
        <div className="min-w-0 space-y-4">
        <TabsContent value="overview" className="mt-4"><AdminOperations section="overview" /></TabsContent>

        <TabsContent value="inventory" className="mt-4"><AdminOperations section="inventory" /></TabsContent>
        <TabsContent value="repairs" className="mt-4"><AdminOperations section="repairs" /></TabsContent>
        <TabsContent value="support" className="mt-4"><AdminOperations section="support" /></TabsContent>
        <TabsContent value="audit" className="mt-4"><AdminOperations section="audit" /></TabsContent>
        <TabsContent value="finance" className="mt-4"><AdminOperations section="finance" /></TabsContent>
        <TabsContent value="promotions" className="mt-4"><AdminPromotions /></TabsContent>

        <TabsContent value="listings" className="mt-4 space-y-2">
          <Button variant="glow" onClick={() => setEditing(null)}><Plus /> Add product</Button>
          {rows.length === 0 && <p className="py-8 text-center text-muted-foreground">No products yet.</p>}
          {rows.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">{(() => { const thumb = p.images.find((src) => !/\.(mp4|webm|mov|m4v)(?:$|[?#])/i.test(src)) ?? p.images[0]; if (!thumb) return <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">No image</div>; return /\.(mp4|webm|mov|m4v)(?:$|[?#])/i.test(thumb) ? <video src={thumb} muted playsInline preload="metadata" className="h-full w-full object-cover" /> : <img src={thumb} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} className="h-full w-full object-cover" />; })()}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.title}</p>
                <p className="text-xs text-muted-foreground">{CATEGORY_LABEL[p.market_category as Category]} · {formatPrice(p.price)} · stock {p.stock}</p>
                <div className="mt-1 flex gap-1">
                  <Badge variant={p.status === "available" ? "default" : "secondary"}>{p.status}</Badge>
                  {p.is_demo && <Badge variant="destructive">demo</Badge>}
                </div>
              </div>
              {p.status !== "sold" && <Button size="icon" variant="ghost" title="Mark sold" onClick={() => markSold(p)}><CheckCheck /></Button>}
              <Button size="icon" variant="ghost" onClick={() => setEditing(p)}><Pencil /></Button>
              <Button size="icon" variant="ghost" onClick={() => remove(p)}><Trash2 /></Button>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="orders"><OwnerOrders /></TabsContent>

        <TabsContent value="offers" className="mt-4 space-y-2">
          {(offers.data ?? []).length === 0 && <p className="py-8 text-center text-muted-foreground">No resale offers yet.</p>}
          {(offers.data ?? []).map((o) => (
            <div key={o.id} className="rounded-lg border bg-card p-4 text-sm">
              <div className="flex justify-between gap-2">
                <p className="font-semibold">{o.name} · <span className="text-primary">{o.contact}</span></p>
                <Badge variant={o.status === "new" ? "default" : "secondary"}>{o.status}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{CATEGORY_LABEL[o.category as Category]} · {new Date(o.created_at).toLocaleDateString()} {o.asking_price ? `· asking ${formatPrice(o.asking_price)}` : ""}</p>
              <p className="mt-2 whitespace-pre-line">{o.item_description}</p>
              {o.condition_notes && <p className="mt-1 text-muted-foreground">{o.condition_notes}</p>}
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setOffer(o.id, "contacted")}>Contacted</Button>
                <Button size="sm" variant="ghost" onClick={() => setOffer(o.id, "closed")}>Close</Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="enquiries"><OwnerEnquiries/></TabsContent>
        <TabsContent value="calc" className="mt-4"><ProfitCalculator /></TabsContent>
        </div>
        </div>
      </Tabs>

      <Sheet open={editing !== undefined} onOpenChange={(o) => !o && setEditing(undefined)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader><SheetTitle>{editing ? "Edit product" : "New product"}</SheetTitle></SheetHeader>
          {editing !== undefined && <div className="px-4 pb-6"><ProductForm product={editing} onDone={() => { setEditing(undefined); refresh(); }} /></div>}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="font-display text-xl font-bold">{value}</p></div>;
}
