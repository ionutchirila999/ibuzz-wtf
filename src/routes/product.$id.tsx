import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, Ban, ShieldCheck, Truck, RotateCcw } from "lucide-react";
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

const productQuery = (id: string) => ({
  queryKey: ["product", id],
  queryFn: async () => {
    const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  },
});

export const Route = createFileRoute("/product/$id")({staticData: { sitemap: true },
  validateSearch: (s: Record<string, unknown>): { lang?: "th" | "en" | "ro" } => ({ lang: s["lang"] === "th" || s["lang"] === "en" || s["lang"] === "ro" ? s["lang"] : undefined }),
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
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Link to="/shop" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> {t("nav.shop")}</Link>
      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery key={p.id} images={p.images} title={localizedTitle(p, lang)} />
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {p.is_demo && <Badge variant="destructive">{t("p.demo")}</Badge>}
            {sold && <Badge variant="outline" className="gap-1 border-warning/50 bg-warning/15 text-warning shadow-none"><Ban className="h-3 w-3" />{t("p.soldOut")}</Badge>}
          </div>
          <h1 className="text-3xl font-bold">{localizedTitle(p, lang)}</h1>
          <p className="font-display text-3xl font-bold text-primary">
            {formatPrice(p.price)} {p.negotiable && <span className="text-sm font-normal text-muted-foreground">{t("p.neg")}</span>}
          </p>
          {sold && <div className="rounded-xl border border-warning/40 bg-warning/10 p-4"><div className="flex items-center gap-2 text-warning"><Ban className="h-5 w-5 shrink-0" /><p className="font-display text-base font-bold">{t("p.soldOut")}</p></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{t("p.soldNotice")}</p></div>}
          <ContactButtons product={p} disabled={sold} />
          {sold && <Button asChild variant="outline" size="lg" className="w-full justify-center gap-1.5 px-3 text-sm"><Link to="/shop">{t("p.soldBrowse")}<ArrowUpRight className="h-4 w-4" /></Link></Button>}
          <dl className="divide-y rounded-xl border bg-card text-sm">
            {rows.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-4 py-2.5"><dt className="text-muted-foreground">{k}</dt><dd className="text-right">{v}</dd></div>
            ))}
          </dl>
          {p.description && <p className="whitespace-pre-line text-sm text-muted-foreground">{localizedDescription(p, lang)}</p>}
          <div className="space-y-3 text-sm">
            {p.authenticity_verified && (
              <div className="flex gap-2"><ShieldCheck className="h-5 w-5 shrink-0 text-success" /><span>{t("p.auth")}{p.authenticity_notes ? ` — ${p.authenticity_notes}` : ""}</span></div>
            )}
            {p.delivery_options && <div className="flex gap-2"><Truck className="h-5 w-5 shrink-0 text-primary" /><span>{p.delivery_options}</span></div>}
            {p.return_policy && <div className="flex gap-2"><RotateCcw className="h-5 w-5 shrink-0 text-primary" /><span>{p.return_policy}</span></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
