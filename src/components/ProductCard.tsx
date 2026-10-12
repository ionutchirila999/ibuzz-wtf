import { Link } from "@tanstack/react-router";
import { ImageOff } from "lucide-react";
import { CONDITION_LABEL, formatPrice, type Product } from "@/lib/shop";
import { Badge } from "@/components/ui/badge";

export function ProductCard({ p }: { p: Product }) {
  const sold = p.status === "sold" || p.stock <= 0;
  return (
    <Link to="/product/$id" params={{ id: p.id }} className="group overflow-hidden rounded-xl border bg-card transition hover:border-primary/60">
      <div className="relative aspect-square bg-muted">
        {p.images[0] ? (
          <img src={p.images[0]} alt={p.title} loading="lazy" className={`h-full w-full object-cover transition group-hover:scale-105 ${sold ? "opacity-40" : ""}`} />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground"><ImageOff /></div>
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {p.is_demo && <Badge variant="destructive">Demo listing</Badge>}
          {sold && <Badge variant="secondary">Sold</Badge>}
        </div>
      </div>
      <div className="space-y-1 p-3">
        <p className="text-xs text-muted-foreground">{p.brand} · {CONDITION_LABEL[p.condition]}</p>
        <h3 className="line-clamp-2 text-sm font-semibold">{p.title}</h3>
        <p className="font-display text-lg font-bold text-primary">
          {formatPrice(p.price)} {p.negotiable && <span className="text-xs font-normal text-muted-foreground">negotiable</span>}
        </p>
      </div>
    </Link>
  );
}
