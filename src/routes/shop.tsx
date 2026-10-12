import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABEL, SUBCATEGORIES, type Category } from "@/lib/shop";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ShopSearch = { category?: Category; q?: string; sub?: string; condition?: string; sort?: string; size?: string };

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): ShopSearch => ({
    category: s.category === "womens_shoes" || s.category === "technology" ? s.category : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
    sub: typeof s.sub === "string" ? s.sub : undefined,
    condition: typeof s.condition === "string" ? s.condition : undefined,
    sort: typeof s.sort === "string" ? s.sort : undefined,
    size: typeof s.size === "string" ? s.size : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop — TechFix Marketplace" },
      { name: "description", content: "Browse refurbished electronics, parts and women's footwear. Search, filter and enquire." },
      { property: "og:title", content: "Shop — TechFix Marketplace" },
      { property: "og:description", content: "Browse refurbished electronics, parts and women's footwear." },
    ],
  }),
  component: Shop,
});

const ALL = "__all";

function Shop() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const set = (patch: Partial<ShopSearch>) => navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  const { data = [], isLoading } = useQuery({
    queryKey: ["products", s],
    queryFn: async () => {
      let q = supabase.from("products").select("*").neq("status", "hidden");
      if (s.category) q = q.eq("category", s.category);
      if (s.sub) q = q.eq("subcategory", s.sub);
      if (s.condition) q = q.eq("condition", s.condition);
      if (s.size) q = q.eq("shoe_size", s.size);
      if (s.q) q = q.or(`title.ilike.%${s.q}%,brand.ilike.%${s.q}%,model.ilike.%${s.q}%`);
      if (s.sort === "price_asc") q = q.order("price", { ascending: true });
      else if (s.sort === "price_desc") q = q.order("price", { ascending: false });
      else q = q.order("created_at", { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const subs = s.category ? SUBCATEGORIES[s.category] : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex gap-2 overflow-x-auto">
        {([undefined, "technology", "womens_shoes"] as const).map((c) => (
          <button key={c ?? "all"} onClick={() => set({ category: c, sub: undefined, size: undefined })}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm ${s.category === c ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            {c ? CATEGORY_LABEL[c] : "All"}
          </button>
        ))}
      </div>

      <div className="mb-6 grid gap-2 md:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search brand, model…" defaultValue={s.q} onChange={(e) => set({ q: e.target.value || undefined })} />
        </div>
        {subs.length > 0 && (
          <Select value={s.sub ?? ALL} onValueChange={(v) => set({ sub: v === ALL ? undefined : v })}>
            <SelectTrigger className="md:w-56"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All types</SelectItem>
              {subs.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={s.condition ?? ALL} onValueChange={(v) => set({ condition: v === ALL ? undefined : v })}>
          <SelectTrigger className="md:w-40"><SelectValue placeholder="Condition" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any condition</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="pre_owned">Pre-owned</SelectItem>
            <SelectItem value="refurbished">Refurbished</SelectItem>
          </SelectContent>
        </Select>
        <Select value={s.sort ?? "newest"} onValueChange={(v) => set({ sort: v === "newest" ? undefined : v })}>
          <SelectTrigger className="md:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price_asc">Price: low to high</SelectItem>
            <SelectItem value="price_desc">Price: high to low</SelectItem>
          </SelectContent>
        </Select>
        {s.category === "womens_shoes" && (
          <Input className="md:w-32" placeholder="Size e.g. 38" defaultValue={s.size} onChange={(e) => set({ size: e.target.value || undefined })} />
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">No items listed here yet. Check back soon or message us.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {data.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
