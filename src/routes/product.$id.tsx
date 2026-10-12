import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ShieldCheck, Truck, RotateCcw, ImageOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CONDITION_LABEL, formatPrice, SHOP_NAME, type Category } from "@/lib/shop";
import { useT } from "@/lib/i18n";
import { ContactButtons } from "@/components/ContactButtons";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: `Product details — ${SHOP_NAME}` },
      { name: "description", content: "Photos, condition, price and availability. Enquire on WhatsApp or LINE." },
      { property: "og:title", content: `Product details — ${SHOP_NAME}` },
      { property: "og:description", content: "Photos, condition, price and availability." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { t, sub } = useT();
  const { id } = Route.useParams();
  const [active, setActive] = useState(0);
  const { data: p, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className="p-8 text-muted-foreground">{t("loading")}</p>;
  if (!p) return <div className="p-8 text-center">{t("p.notFound")} <Link to="/shop" className="text-primary">{t("p.back")}</Link></div>;

  const sold = p.status === "sold" || p.stock <= 0;
  const rows: [string, string | null][] = [
    [t("p.category"), `${t(`cat.${p.category as Category}`)} · ${sub(p.subcategory)}`],
    [t("p.brand"), p.brand], [t("p.model"), p.model], [t("shop.condition"), CONDITION_LABEL[p.condition] ? t(`cond.${p.condition}` as never) : p.condition],
    [t("p.size"), p.shoe_size ? `${p.shoe_size} ${p.size_system ?? ""}` : null],
    [t("p.color"), p.color], [t("p.material"), p.material],
    [t("p.avail"), sold ? t("p.soldOut") : `${p.stock} ${t("p.inStock")}`],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Link to="/shop" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> {t("nav.shop")}</Link>
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-xl border bg-muted">
            {p.images[active] ? <img src={p.images[active]} alt={p.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-muted-foreground"><ImageOff /></div>}
          </div>
          {p.images.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {p.images.map((src, i) => (
                <button key={src} onClick={() => setActive(i)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 ${i === active ? "border-primary" : "border-transparent"}`}>
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {p.is_demo && <Badge variant="destructive">{t("p.demo")}</Badge>}
            {sold && <Badge variant="secondary">{t("card.sold")}</Badge>}
          </div>
          <h1 className="text-3xl font-bold">{p.title}</h1>
          <p className="font-display text-3xl font-bold text-primary">
            {formatPrice(p.price)} {p.negotiable && <span className="text-sm font-normal text-muted-foreground">{t("p.neg")}</span>}
          </p>
          {!sold && <ContactButtons product={p} />}
          <dl className="divide-y rounded-xl border bg-card text-sm">
            {rows.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-4 py-2.5"><dt className="text-muted-foreground">{k}</dt><dd className="text-right">{v}</dd></div>
            ))}
          </dl>
          {p.description && <p className="whitespace-pre-line text-sm text-muted-foreground">{p.description}</p>}
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
