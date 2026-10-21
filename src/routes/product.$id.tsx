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
    <div className="relative mx-auto w-full min-w-0 max-w-7xl overflow-x-clip px-3 py-4 sm:px-5 sm:py-7 lg:px-8 lg:py-10">
      <Link to="/shop" className="mb-5 inline-flex min-h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 text-sm text-muted-foreground transition hover:border-cyan-300/30 hover:text-foreground"><ArrowLeft className="h-4 w-4" /> {t("nav.shop")}</Link>
      <div className="grid min-w-0 items-start gap-5 md:gap-7 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] xl:gap-10">
        <section className="min-w-0 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.055] to-white/[0.015] p-2 shadow-[0_24px_90px_-48px_rgba(34,211,238,0.35)] sm:p-3 lg:rounded-3xl lg:p-4"><ProductGallery key={p.id} images={p.images} title={localizedTitle(p, lang)} videoUrl={p.video_url} /><div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-3 py-1.5"><PackageCheck className="h-3.5 w-3.5 text-primary" />{sold ? t("p.soldOut") : `${p.stock} ${t("p.inStock")}`}</span>{p.authenticity_verified && <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-emerald-600"><ShieldCheck className="h-3.5 w-3.5" />{t("p.auth")}</span>}</div></section>
        <div className="min-w-0 space-y-4 sm:space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-wrap gap-2">
            {p.is_demo && <Badge variant="destructive">{t("p.demo")}</Badge>}
            {sold && <Badge variant="outline" className="gap-1 border-warning/50 bg-warning/15 text-warning shadow-none"><Ban className="h-3 w-3" />{t("p.soldOut")}</Badge>}
          </div>
          <h1 className="min-w-0 max-w-full break-words text-balance text-2xl font-bold leading-tight tracking-tight sm:text-3xl xl:text-4xl">{localizedTitle(p, lang)}</h1>
          <p className="min-w-0 max-w-full break-words border-b border-white/10 pb-4 font-display text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
            {formatPrice(p.price)} {p.negotiable && <span className="text-sm font-normal text-muted-foreground">{t("p.neg")}</span>}
          </p>
          {sold && <div className="rounded-xl border border-warning/40 bg-warning/10 p-4"><div className="flex items-center gap-2 text-warning"><Ban className="h-5 w-5 shrink-0" /><p className="font-display text-base font-bold">{t("p.soldOut")}</p></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{t("p.soldNotice")}</p></div>}
          {!sold && !p.negotiable && <Button size="default" className="min-h-12 w-full justify-center gap-2 rounded-xl text-base font-semibold shadow-[0_8px_30px_-12px_rgba(34,211,238,0.5)] sm:min-h-13" onClick={() => {
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
          }}><ShoppingCart className="h-4 w-4" /> {t("p.addCartCheckout")}</Button>}
          <ContactButtons product={p} disabled={sold} />
          {sold && <Button asChild variant="outline" size="lg" className="w-full justify-center gap-1.5 px-3 text-sm"><Link to="/shop">{t("p.soldBrowse")}<ArrowUpRight className="h-4 w-4" /></Link></Button>}
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] backdrop-blur-xl"><div className="border-b border-white/10 px-4 py-3 sm:px-5"><h2 className="font-semibold tracking-tight">{t("p.details")}</h2></div><dl className="grid grid-cols-1 divide-y divide-border/60 text-sm sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
            {rows.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex min-w-0 items-start gap-3 px-4 py-3 sm:px-5"><span className="mt-0.5 text-primary">{k === t("p.category") ? <Layers className="h-4 w-4" /> : k === t("p.brand") ? <Tag className="h-4 w-4" /> : k === t("p.size") ? <Ruler className="h-4 w-4" /> : k === t("p.color") ? <Palette className="h-4 w-4" /> : <PackageCheck className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="mt-1 break-words font-medium">{v}</dd></div></div>
            ))}
          </dl></section>
          {p.description && <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5"><h2 className="font-semibold tracking-tight">{t("p.about")}</h2><p className="whitespace-pre-line break-words text-sm leading-7 text-muted-foreground">{localizedDescription(p, lang)}</p></section>}
          <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5"><h2 className="font-semibold tracking-tight">{t("p.confidence")}</h2><div className="space-y-3 text-sm">
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
