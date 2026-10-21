import { Link } from "@tanstack/react-router";
import { Ban, ImageOff } from "lucide-react";
import { CONDITION_LABEL, formatPrice, localizedTitle, type Product } from "@/lib/shop";
import { copy } from "@/lib/service-copy";
import { useT } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";

type MarketCardProduct = Pick<Product, "id" | "images" | "title" | "title_th" | "title_ro" | "brand" | "market_condition" | "status" | "stock" | "is_demo" | "price" | "negotiable">;

export function ProductCard({ p }: { p: MarketCardProduct }) {
  const { t, lang } = useT();
  const sold = p.status === "sold" || p.stock <= 0;
  const isVideo = (src: string) => /\.(mp4|webm|mov|m4v)(?:$|[?#])/i.test(src);
  const thumbnail = p.images.find((src) => !isVideo(src)) ?? p.images[0];
  return (
    <Link to="/product/$id" params={{ id: p.id }} className="group relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-slate-950/90 via-card to-slate-950/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/60 hover:shadow-[0_16px_38px_-24px_rgba(34,211,238,0.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
      <div className="relative aspect-square bg-muted">
        {thumbnail ? (
          <img src={thumbnail} alt={p.title} loading="lazy" className={`h-full w-full object-cover transition group-hover:scale-105 group-focus-visible:scale-105 ${sold ? "opacity-40" : ""}`} />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground"><ImageOff /></div>
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {p.is_demo && <Badge variant="destructive">{t("card.demo")}</Badge>}
          {sold ? <Badge variant="outline" className="gap-1 border-warning/50 bg-warning/15 text-warning shadow-none"><Ban className="h-3 w-3" />{t("p.soldOut")}</Badge> : <Badge variant="secondary">{copy(lang,"available")}</Badge>}
        </div>
      </div>
      <div className="space-y-1 p-3">
        <p className="text-xs text-muted-foreground">{p.brand} · {["repaired_tested","untested","for_parts"].includes(p.market_condition) ? copy(lang,p.market_condition as "repaired_tested" | "untested" | "for_parts") : CONDITION_LABEL[p.market_condition] ? t(`cond.${p.market_condition}` as never) : p.market_condition}</p>
        <h3 className="line-clamp-2 text-sm font-semibold">{localizedTitle(p, lang)}</h3>
        <p className="font-display text-lg font-bold text-primary-soft">
          {formatPrice(p.price)} {p.negotiable && <span className="text-xs font-normal text-muted-foreground">{t("card.neg")}</span>}
        </p>
      </div>
    </Link>
  );
}
