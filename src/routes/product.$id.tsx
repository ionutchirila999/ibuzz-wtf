import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, Ban, ShieldCheck, Truck, RotateCcw, PackageCheck, Tag, Ruler, Palette, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CONDITION_LABEL, formatPrice, localizedDescription, localizedTitle, SHOP_NAME, SOCIAL_IMAGE, type Category } from "@/lib/shop";
import { copy } from "@/lib/service-copy";
import { useT } from "@/lib/i18n";
import { ContactButtons } from "@/components/ContactButtons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PRODUCT_SHARE, shareLang } from "@/lib/share-meta";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ProductGallery } from "@/components/ProductGallery";
import { ShoppingCart } from "lucide-react";

const productQuery = (id: string) => ({
  queryKey: ["product", id],
  queryFn: async () => {
    const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  },
});

export const Route = createFileRoute("/product/$id")({staticData: { sitemap: true },
  validateSearch: (s: Record<string, unknown>): { lang?: "th" | "en" | "ro" | undefined } => ({ lang: s["lang"] === "th" || s["lang"] === "en" || s["lang"] === "ro" ? s["lang"] : undefined }),
  loader: async ({ params, context }) => {
    try { return await context.queryClient.ensureQueryData(productQuery(params.id)); } catch { return null; }
  },
  head: ({ params, loaderData: p, match }) => {
    const L = shareLang((match.search as { lang?: string }).lang);
    const T = PRODUCT_SHARE[L];
    const name = p ? localizedTitle(p, L) : T.fallback;
    const price = p ? formatPrice(p.price) : "";
    const sold = p && (p.status === "sold" || p.stock <= 0);
    const title = `${name}${price ? ` — ${price}` : ""} | ${T.market}`;
    const raw = p ? localizedDescription(p, L) ?? "" : "";
    const desc = p
      ? `${sold ? `${T.sold}. ` : ""}${raw.replace(/\s+/g, " ").trim().slice(0, 140)}${raw.length > 140 ? "…" : ""} ${T.enquire}`.trim()
      : T.generic;
    // Only the small share copy is used — full photos are too large for WhatsApp previews.
    const image = p?.share_image?.startsWith("https://") ? p.share_image : SOCIAL_IMAGE;
    const url = `https://ibuzz.wtf/product/${params.id}${L === "th" ? "" : `?lang=${L}`}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: image },
        ...(image !== SOCIAL_IMAGE ? [{ property: "og:image:width", content: "1200" }, { property: "og:image:height", content: "630" }, { property: "og:image:type", content: "image/jpeg" }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { t, sub, lang } = useT();
  const { id } = Route.useParams();
  const urlLang = Route.useSearch().lang;
  const navigate = useNavigate();
  // Keep the visitor's language in the address so a copied link previews in it.
  useEffect(() => { if (urlLang !== lang) void navigate({ to: ".", search: (prev) => ({ ...prev, lang }), replace: true }); }, [lang, urlLang, navigate]);
  const { data: p, isLoading } = useQuery(productQuery(id));

  if (isLoading) return <p className="p-8 text-muted-foreground">{t("loading")}</p>;
  if (!p) return <div className="p-8 text-center">{t("p.notFound")} <Link to="/shop" className="text-primary">{t("p.back")}</Link></div>;

  const sold = p.status === "sold" || p.stock <= 0;
  const rows: [string, string | null][] = [
    [t("p.category"), `${t(`cat.${p.market_category as Category}`)} · ${sub(p.subcategory)}`],
    [t("p.brand"), p.brand], [t("p.model"), p.model], [t("shop.condition"), ["repaired_tested","untested","for_parts"].includes(p.market_condition) ? copy(lang,p.market_condition as "repaired_tested" | "untested" | "for_parts") : CONDITION_LABEL[p.market_condition] ? t(`cond.${p.market_condition}` as never) : p.market_condition],
    [t("p.size"), p.shoe_size ? `${p.shoe_size} ${p.size_system ?? ""}` : null],
    [t("p.color"), p.color], [t("p.material"), p.material],
    [t("p.avail"), sold ? t("p.soldOut") : `${p.stock} ${t("p.inStock")}`],
  ];

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
      <Link to="/shop" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> {t("nav.shop")}</Link>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:gap-10">
        <section className="min-w-0 rounded-2xl border border-border/70 bg-card/70 p-3 shadow-xl shadow-black/5 backdrop-blur sm:p-5"><ProductGallery key={p.id} images={p.images} title={localizedTitle(p, lang)} videoUrl={p.video_url} /><div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-3 py-1.5"><PackageCheck className="h-3.5 w-3.5 text-primary" />{sold ? t("p.soldOut") : `${p.stock} ${t("p.inStock")}`}</span>{p.authenticity_verified && <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-emerald-600"><ShieldCheck className="h-3.5 w-3.5" />{t("p.auth")}</span>}</div></section>
        <div className="min-w-0 space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-wrap gap-2">
            {p.is_demo && <Badge variant="destructive">{t("p.demo")}</Badge>}
            {sold && <Badge variant="outline" className="gap-1 border-warning/50 bg-warning/15 text-warning shadow-none"><Ban className="h-3 w-3" />{t("p.soldOut")}</Badge>}
          </div>
          <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{localizedTitle(p, lang)}</h1>
          <p className="border-b border-border/70 pb-5 font-display text-4xl font-extrabold tracking-tight text-primary sm:text-5xl">
            {formatPrice(p.price)} {p.negotiable && <span className="text-sm font-normal text-muted-foreground">{t("p.neg")}</span>}
          </p>
          {sold && <div className="rounded-xl border border-warning/40 bg-warning/10 p-4"><div className="flex items-center gap-2 text-warning"><Ban className="h-5 w-5 shrink-0" /><p className="font-display text-base font-bold">{t("p.soldOut")}</p></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{t("p.soldNotice")}</p></div>}
          {!sold && !p.negotiable && <Button size="lg" className="w-full justify-center gap-2" onClick={() => {
            try {
              const key = "ibuzz-cart-v1";
              const current = JSON.parse(localStorage.getItem(key) || "[]") as { id: string; quantity: number }[];
              const found = current.find((item) => item.id === p.id);
              const next = found
                ? current.map((item) => item.id === p.id ? { ...item, quantity: Math.min(item.quantity + 1, p.stock) } : item)
                : [...current, { id: p.id, quantity: 1 }];
              localStorage.setItem(key, JSON.stringify(next));
              void navigate({ to: "/checkout" });
            } catch { void navigate({ to: "/checkout" }); }
          }}><ShoppingCart className="h-4 w-4" /> Add to cart & checkout</Button>}
          <ContactButtons product={p} disabled={sold} />
          {sold && <Button asChild variant="outline" size="lg" className="w-full justify-center gap-1.5 px-3 text-sm"><Link to="/shop">{t("p.soldBrowse")}<ArrowUpRight className="h-4 w-4" /></Link></Button>}
          <section className="overflow-hidden rounded-2xl border border-border/70 bg-card/80"><div className="border-b border-border/70 px-4 py-3"><h2 className="font-semibold tracking-tight">Product details</h2></div><dl className="grid grid-cols-1 divide-y divide-border/60 text-sm sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
            {rows.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex min-w-0 items-start gap-3 px-4 py-3"><span className="mt-0.5 text-primary">{k === t("p.category") ? <Layers className="h-4 w-4" /> : k === t("p.brand") ? <Tag className="h-4 w-4" /> : k === t("p.size") ? <Ruler className="h-4 w-4" /> : k === t("p.color") ? <Palette className="h-4 w-4" /> : <PackageCheck className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="mt-1 break-words font-medium">{v}</dd></div></div>
            ))}
          </dl></section>
          {p.description && <section className="space-y-2 rounded-2xl border border-border/70 bg-card/70 p-4 sm:p-5"><h2 className="font-semibold tracking-tight">About this product</h2><p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{localizedDescription(p, lang)}</p></section>}
          <section className="space-y-3 rounded-2xl border border-border/70 bg-card/70 p-4 sm:p-5"><h2 className="font-semibold tracking-tight">Shopping with confidence</h2><div className="space-y-3 text-sm">
            {p.authenticity_verified && (
              <div className="flex gap-2"><ShieldCheck className="h-5 w-5 shrink-0 text-success" /><span>{t("p.auth")}{p.authenticity_notes ? ` — ${p.authenticity_notes}` : ""}</span></div>
            )}
            {p.delivery_options && <div className="flex gap-2"><Truck className="h-5 w-5 shrink-0 text-primary" /><span>{p.delivery_options}</span></div>}
            {p.return_policy && <div className="flex gap-2"><RotateCcw className="h-5 w-5 shrink-0 text-primary" /><span>{p.return_policy}</span></div>}
          </div></section>
        </div>
      </div>
    </div>
  );
}
