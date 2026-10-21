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
import { EnquiryForm } from "@/components/EnquiryForm";
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

  const addToCart = () => {
    try {
      const key = "ibuzz-cart-v1";
      const current = JSON.parse(localStorage.getItem(key) || "[]") as { id: string; quantity: number }[];
      const found = current.find((item) => item.id === p.id);
      const next = found
        ? current.map((item) => item.id === p.id ? { ...item, quantity: Math.min(item.quantity + 1, p.stock) } : item)
        : [...current, { id: p.id, quantity: 1 }];
      localStorage.setItem(key, JSON.stringify(next));
    } catch { /* Checkout can still open if browser storage is unavailable. */ }
    void navigate({ to: "/checkout" });
  };

  return (
    <main className="mx-auto w-full min-w-0 max-w-[1440px] px-4 pb-28 pt-4 sm:px-6 sm:pt-6 lg:px-10 lg:pb-12">
      <nav className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/shop" className="inline-flex min-h-10 items-center gap-2 rounded-lg pr-2 hover:text-foreground"><ArrowLeft className="h-4 w-4" />{t("nav.shop")}</Link>
        <span aria-hidden="true">/</span><span className="max-w-[65vw] truncate text-foreground">{localizedTitle(p, lang)}</span>
      </nav>

      <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] xl:gap-14">
        <section className="min-w-0">
          <ProductGallery key={p.id} images={p.images} title={localizedTitle(p, lang)} />
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-2"><PackageCheck className="h-4 w-4 text-primary" />{sold ? t("p.soldOut") : `${p.stock} ${t("p.inStock")}`}</span>
            {p.authenticity_verified && <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-emerald-600"><ShieldCheck className="h-4 w-4" />{t("p.auth")}</span>}
            {p.is_demo && <Badge variant="destructive">{t("p.demo")}</Badge>}
          </div>
          {p.description && <section className="mt-8 rounded-2xl border border-border/70 bg-card p-5 sm:p-7">
            <h2 className="text-lg font-semibold tracking-tight">{t("p.about")}</h2>
            <p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-muted-foreground sm:text-base">{localizedDescription(p, lang)}</p>
          </section>}
          <section className="mt-5 overflow-hidden rounded-2xl border border-border/70 bg-card">
            <div className="border-b border-border/70 px-5 py-4"><h2 className="font-semibold tracking-tight">{t("p.details")}</h2></div>
            <dl className="grid grid-cols-1 divide-y divide-border/60 text-sm sm:grid-cols-2 sm:divide-y-0">
              {rows.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex min-w-0 items-start gap-3 border-border/60 px-5 py-4 sm:even:border-l">
                  <span className="mt-0.5 text-primary">{k === t("p.category") ? <Layers className="h-4 w-4" /> : k === t("p.brand") ? <Tag className="h-4 w-4" /> : k === t("p.size") ? <Ruler className="h-4 w-4" /> : k === t("p.color") ? <Palette className="h-4 w-4" /> : <PackageCheck className="h-4 w-4" />}</span>
                  <div className="min-w-0 flex-1"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="mt-1 break-words font-medium text-foreground">{v}</dd></div>
                </div>
              ))}
            </dl>
          </section>
          {(p.authenticity_verified || p.delivery_options || p.return_policy) && <section className="mt-5 rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
            <h2 className="font-semibold tracking-tight">{t("p.confidence")}</h2>
            <div className="mt-4 space-y-4 text-sm leading-6 text-muted-foreground">
              {p.authenticity_verified && <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><span>{t("p.auth")}{p.authenticity_notes ? ` — ${p.authenticity_notes}` : ""}</span></div>}
              {p.delivery_options && <div className="flex gap-3"><Truck className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><span>{p.delivery_options}</span></div>}
              {p.return_policy && <div className="flex gap-3"><RotateCcw className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><span>{p.return_policy}</span></div>}
            </div>
          </section>}
        </section>

        <aside className="min-w-0 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap gap-2">
              {p.is_demo && <Badge variant="destructive">{t("p.demo")}</Badge>}
              {sold && <Badge variant="outline" className="gap-1 border-warning/50 bg-warning/15 text-warning shadow-none"><Ban className="h-3 w-3" />{t("p.soldOut")}</Badge>}
              {p.market_condition && <Badge variant="secondary">{rows.find(([k]) => k === t("shop.condition"))?.[1]}</Badge>}
            </div>
            <h1 className="mt-3 break-words text-balance text-xl font-bold leading-snug tracking-tight sm:text-2xl xl:text-3xl">{localizedTitle(p, lang)}</h1>
            <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1 border-b border-border/70 pb-5">
              <p className="font-display text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">{formatPrice(p.price)}</p>
              {p.negotiable && <span className="pb-1 text-sm text-muted-foreground">{t("p.neg")}</span>}
            </div>
            <div className="mt-5 flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{t("p.avail")}</span>
              <span className={sold ? "font-semibold text-destructive" : "font-semibold text-emerald-600"}>{sold ? t("p.soldOut") : `${p.stock} ${t("p.inStock")}`}</span>
            </div>
            {sold && <div className="mt-4 rounded-xl border border-warning/40 bg-warning/10 p-4"><p className="font-semibold">{t("p.soldNotice")}</p></div>}
            {!sold && !p.negotiable && <Button size="lg" className="mt-5 min-h-12 w-full gap-2 rounded-xl text-base font-semibold" onClick={addToCart}><ShoppingCart className="h-5 w-5" />{t("p.addCartCheckout")}</Button>}
            <div className="mt-3"><ContactButtons product={p} disabled={sold} /></div>
            {!sold && <details className="mt-4 rounded-xl border border-border/70 bg-background">
              <summary className="cursor-pointer list-none px-4 py-4 text-sm font-semibold marker:hidden">
                <span className="flex items-center justify-between gap-3">
                  <span>{lang === "th" ? "สอบถามเกี่ยวกับสินค้านี้" : lang === "ro" ? "Întreabă despre acest produs" : "Ask about this item"}</span>
                  <span className="text-primary" aria-hidden="true">+</span>
                </span>
                <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">{lang === "th" ? "ฝากข้อความไว้ แล้วเราจะติดต่อกลับ" : lang === "ro" ? "Lasă-ne un mesaj și te vom contacta." : "Leave a message and we’ll follow up with you."}</span>
              </summary>
              <div className="border-t border-border/70 p-4">
                <EnquiryForm kind="product" service={localizedTitle(p, lang)} />
              </div>
            </details>}
            {sold && <Button asChild variant="outline" size="lg" className="mt-3 w-full rounded-xl"><Link to="/shop">{t("p.soldBrowse")}<ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button>}
            <div className="mt-5 rounded-xl bg-muted/50 p-4">
              <p className="text-sm font-semibold">{lang === "th" ? "มีคำถามเกี่ยวกับสินค้านี้?" : lang === "ro" ? "Ai întrebări despre acest produs?" : "Have a question about this item?"}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{lang === "th" ? "ติดต่อเราเพื่อยืนยันรายละเอียด การจัดส่ง หรือขอสินค้าใกล้เคียง" : lang === "ro" ? "Scrie-ne pentru detalii, livrare sau pentru a găsi un produs similar." : "Message us to confirm details, delivery, or find a similar item."}</p>
            </div>
          </div>
        </aside>
      </div>

      {!sold && !p.negotiable && <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_28px_rgba(0,0,0,0.10)] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="min-w-0 flex-1"><p className="truncate text-xs text-muted-foreground">{localizedTitle(p, lang)}</p><p className="font-display text-lg font-extrabold leading-tight text-primary">{formatPrice(p.price)}</p></div>
          <Button size="lg" className="min-h-12 shrink-0 gap-2 rounded-xl px-5 font-semibold" onClick={addToCart}><ShoppingCart className="h-4 w-4" />{t("p.addCartCheckout")}</Button>
        </div>
      </div>}
    </main>
  );
}
