import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CheckCheck, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { CATEGORY_LABEL, formatPrice, SHOP_NAME, type Category, type Product } from "@/lib/shop";
import { ProductForm } from "@/components/admin/ProductForm";
import { OwnerEnquiries, OfferPhotos } from "@/components/admin/OwnerEnquiries";
import { ProfitCalculator } from "@/components/admin/ProfitCalculator";
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
  const soldProfit = rows.filter((p) => p.status === "sold").reduce((sum, p) => {
    const c = p.product_costs;
    return sum + Number(p.price) - (c ? Number(c.purchase_cost) + Number(c.repair_cost) + Number(c.shipping_cost) + Number(c.platform_fees) + Number(c.other_expenses) : 0);
  }, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Owner dashboard</h1>
        <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}><LogOut /> Sign out</Button>
      </div>
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat label="Listed" value={String(rows.filter((p) => p.status === "available").length)} />
        <Stat label="Sold" value={String(rows.filter((p) => p.status === "sold").length)} />
        <Stat label="Profit from sold" value={formatPrice(soldProfit)} />
      </div>
      <Tabs defaultValue="listings">
        <TabsList>
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="offers">Offers {offers.data?.filter((o) => o.status === "new").length ? `(${offers.data.filter((o) => o.status === "new").length})` : ""}</TabsTrigger>
          <TabsTrigger value="enquiries">Service enquiries</TabsTrigger>
          <TabsTrigger value="calc">Profit calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="mt-4 space-y-2">
          <Button variant="glow" onClick={() => setEditing(null)}><Plus /> Add product</Button>
          {rows.length === 0 && <p className="py-8 text-center text-muted-foreground">No products yet.</p>}
          {rows.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">{p.images[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}</div>
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
