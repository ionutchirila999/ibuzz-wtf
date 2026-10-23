import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/shop";
import { useT } from "@/lib/i18n";

type RelatedProduct = {
  id: string;
  title: string;
  title_th?: string | null;
  title_ro?: string | null;
  price: number;
  images?: string[] | null;
  stock: number;
  status?: string | null;
  market_category: string;
};

export function RelatedProducts({ productId, category }: { productId: string; category: string | null }) {
  const { t, lang } = useT();
  const { data: products = [] } = useQuery({
    queryKey: ["related-products", productId, category],
    enabled: Boolean(category),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,title,title_th,title_ro,price,images,stock,status,market_category")
        .eq("market_category", category!)
        .neq("id", productId)
        .eq("status", "available")
        .gt("stock", 0)
        .limit(12);
      if (error) throw error;
      return ((data ?? []) as RelatedProduct[]).filter((product) => product.status !== "sold").slice(0, 4);
    },
  });

  if (!products.length) return null;

  return (
    <section className="mt-10 border-t border-border/70 pt-8" aria-labelledby="related-products-title">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 id="related-products-title" className="text-xl font-bold tracking-tight">
            {lang === "th" ? "สินค้าที่คล้ายกัน" : lang === "ro" ? "Produse similare" : "You may also like"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {lang === "th" ? "สินค้าอื่นในหมวดหมู่เดียวกัน" : lang === "ro" ? "Mai multe produse din aceeași categorie" : "More items from the same category"}
          </p>
        </div>
        <Link to="/shop" className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-medium text-primary hover:underline">
          {t("nav.shop")} <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {products.map((product) => {
          const image = product.images?.find((url) => typeof url === "string" && url.startsWith("https://"));
          const isVideo = Boolean(image && /\.(mp4|webm|mov|m4v)(?:$|[?#])/i.test(image));
          return (
            <Link key={product.id} to="/product/$id" params={{ id: product.id }} className="group min-w-0 overflow-hidden rounded-xl border border-border/70 bg-card transition-colors hover:border-primary/50">
              <div className="aspect-square overflow-hidden bg-muted">
                {image ? (
                  isVideo ? (
                    <video src={image} muted playsInline preload="metadata" aria-label={((lang === "th" ? product.title_th : lang === "ro" ? product.title_ro : null) || product.title)} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <img src={image} alt={((lang === "th" ? product.title_th : lang === "ro" ? product.title_ro : null) || product.title)} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  )
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground"><Package className="h-8 w-8" /></div>
                )}
              </div>
              <div className="p-3">
                <h3 className="line-clamp-2 min-h-10 break-words text-sm font-medium">{(lang === "th" ? product.title_th : lang === "ro" ? product.title_ro : null) || product.title}</h3>
                <p className="mt-2 font-semibold text-primary">{formatPrice(product.price)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{product.stock} {lang === "th" ? "ชิ้นในสต็อก" : lang === "ro" ? "în stoc" : "in stock"}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
