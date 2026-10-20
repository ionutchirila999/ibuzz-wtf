import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { copy } from "@/lib/service-copy";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SHOP_NAME, SOCIAL_IMAGE, SUBCATEGORIES, productSearchConditions, type Category } from "@/lib/shop";
import { marketShare, shareLang } from "@/lib/share-meta";
import { useT } from "@/lib/i18n";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ShopSearch = { category?: Category | undefined; q?: string | undefined; sub?: string | undefined; condition?: string | undefined; sort?: string | undefined; audience?: string | undefined; status?: string | undefined; size?: string | undefined; lang?: "th" | "en" | "ro" | undefined };

// The address bar turns a typed number (10000, shoe size 42) into a number, so
// every text filter is read back as text — otherwise it is silently dropped.
const str = (v: unknown) => (v == null ? undefined : String(v));

export const Route = createFileRoute("/shop")({staticData: { sitemap: true },
  validateSearch: (s: Record<string, unknown>): ShopSearch => ({
    category: s["category"] === "womens_shoes" ? "footwear" : s["category"] === "technology" || s["category"] === "clothing" || s["category"] === "footwear" ? s["category"] : undefined,
    audience: ["men","women","children"].includes(String(s["audience"])) ? String(s["audience"]) : undefined,
    status: s["status"] === "available" || s["status"] === "sold" ? s["status"] : undefined,
    q: str(s["q"]),
    sub: str(s["sub"]),
    condition: str(s["condition"]),
    sort: str(s["sort"]),
    size: str(s["size"]),
    lang: s["lang"] === "th" || s["lang"] === "en" || s["lang"] === "ro" ? s["lang"] : undefined,
  }),
  head: ({ match }) => {
    const { category: cat, lang } = match.search as ShopSearch;
    const L = shareLang(lang);
    const { title, desc } = marketShare(L, cat);
    const qs = new URLSearchParams({ ...(cat ? { category: cat } : {}), ...(L !== "th" ? { lang: L } : {}) }).toString();
    const url = `https://ibuzz.wtf/shop${qs ? `?${qs}` : ""}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:image", content: SOCIAL_IMAGE },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: SOCIAL_IMAGE },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: Shop,
});

const ALL = "__all";

function Shop() {
  const { t, sub, lang } = useT();
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  // Keep the visitor's language in the address so a copied link previews in it.
  useEffect(() => { if (s.lang !== lang) void navigate({ search: (prev) => ({ ...prev, lang }), replace: true }); }, [lang, s.lang, navigate]);
  const set = (patch: Partial<ShopSearch>) => navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["products", s],
    staleTime: 30_000,
    retry: 1,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      // Fetch the public product list with the simplest possible PostgREST query.
      // The database's public-read policy already excludes hidden products.
      // Apply storefront filters in the browser so one unsupported filter/order
      // cannot make the entire Market appear broken.
      const { data: rows, error } = await supabase.from("products").select("*");
      if (error) throw error;

      const term = String(s.q ?? "").normalize("NFC").trim().toLocaleLowerCase();
      const filtered = (rows ?? []).filter((p) => {
        if (s.category && p.market_category !== s.category) return false;
        if (s.sub && p.subcategory !== s.sub) return false;
        if (s.condition && p.market_condition !== s.condition) return false;
        if (s.size && String(p.shoe_size ?? "") !== s.size) return false;
        if (s.audience && p.audience !== s.audience) return false;
        if (s.status && p.status !== s.status) return false;
        if (term) {
          const searchable = [p.title, p.title_th, p.title_ro, p.brand, p.model,
            p.description, p.description_th, p.description_ro]
            .filter(Boolean).join(" ").normalize("NFC").toLocaleLowerCase();
          if (!searchable.includes(term)) return false;
        }
        return true;
      });

      return filtered.sort((a, b) => {
        if (s.sort === "price_asc") return Number(a.price) - Number(b.price);
        if (s.sort === "price_desc") return Number(b.price) - Number(a.price);
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    },
  });

  const subs = s.category ? SUBCATEGORIES[s.category] : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-3 text-3xl font-bold">iBuzz.wtf {copy(lang,"market")}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{copy(lang,"marketLead")}</p>
      <div className="mb-6 flex gap-2 overflow-x-auto">
        {([undefined, "technology", "clothing", "footwear"] as const).map((c) => (
          <Button variant={s.category === c ? "default" : "outline"} key={c ?? "all"} onClick={() => set({ category: c, sub: undefined, size: undefined })}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm ${s["category"] === c ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            {c ? t(`cat.${c}`) : t("shop.all")}
          </Button>
        ))}
      </div>

      <div className="mb-6 grid gap-2 md:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder={t("shop.search")} defaultValue={s.q} onChange={(e) => set({ q: e.target.value || undefined })} />
        </div>
        {subs.length > 0 && (
          <Select value={s.sub ?? ALL} onValueChange={(v) => set({ sub: v === ALL ? undefined : v })}>
            <SelectTrigger className="md:w-56"><SelectValue placeholder={t("shop.type")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("shop.allTypes")}</SelectItem>
              {subs.map((x) => <SelectItem key={x} value={x}>{sub(x)}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={s.condition ?? ALL} onValueChange={(v) => set({ condition: v === ALL ? undefined : v })}>
          <SelectTrigger className="md:w-40"><SelectValue placeholder={t("shop.condition")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("shop.anyCond")}</SelectItem>
            <SelectItem value="new">{t("cond.new")}</SelectItem>
            <SelectItem value="pre_owned">{t("cond.pre_owned")}</SelectItem>
            <SelectItem value="refurbished">{t("cond.refurbished")}</SelectItem>
            {(["repaired_tested","untested","for_parts"] as const).map(c=><SelectItem key={c} value={c}>{copy(lang,c)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={s.sort ?? "newest"} onValueChange={(v) => set({ sort: v === "newest" ? undefined : v })}>
          <SelectTrigger className="md:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("shop.newest")}</SelectItem>
            <SelectItem value="price_asc">{t("shop.priceAsc")}</SelectItem>
            <SelectItem value="price_desc">{t("shop.priceDesc")}</SelectItem>
          </SelectContent>
        </Select>
        {(s.category === "footwear" || s.category === "clothing") && (
          <Input className="md:w-32" placeholder={t("shop.size")} defaultValue={s.size} onChange={(e) => set({ size: e.target.value || undefined })} />
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3"><Select value={s.audience ?? ALL} onValueChange={v=>set({audience:v===ALL?undefined:v})}><SelectTrigger className="w-44"><SelectValue placeholder={copy(lang,"audience")}/></SelectTrigger><SelectContent><SelectItem value={ALL}>{copy(lang,"all")}</SelectItem>{(["men","women","children"] as const).map(v=><SelectItem key={v} value={v}>{copy(lang,v)}</SelectItem>)}</SelectContent></Select>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={copy(lang,"availability")}><span className="text-sm text-muted-foreground">{copy(lang,"availability")}</span>{([undefined,"available","sold"] as const).map(v=><Button key={v??"all"} variant={s.status===v?"default":"outline"} onClick={()=>set({status:v})} className={`rounded-full px-4 py-1.5 text-sm ${s.status===v?"border-primary bg-primary text-primary-foreground":"text-muted-foreground"}`}>{v?copy(lang,v):copy(lang,"all")}</Button>)}</div>
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">{t("loading")}</p>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/40 p-8 text-center">
          <p className="font-semibold">{lang === "th" ? "ไม่สามารถโหลดสินค้าได้" : lang === "ro" ? "Produsele nu au putut fi încărcate." : "Products could not be loaded."}</p>
          <p className="mt-2 text-sm text-muted-foreground">{lang === "th" ? "กรุณารีเฟรชหน้า หากยังพบปัญหา โปรดตรวจสอบการเชื่อมต่อฐานข้อมูลสินค้า" : lang === "ro" ? "Reîmprospătează pagina. Dacă problema continuă, trebuie verificată conexiunea la baza de date a produselor." : "Please refresh the page. If this continues, the product database connection needs checking."}</p>
          <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>{lang === "th" ? "รีเฟรชตลาด" : lang === "ro" ? "Reîmprospătează piața" : "Refresh Market"}</Button>
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">{t("shop.empty")}</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {data.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
