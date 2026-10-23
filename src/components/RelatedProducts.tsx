import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Package, Play } from "lucide-react";
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

const isVideoUrl = (url: string) => /\.(mp4|webm|mov|m4v)(?:$|[?#])/i.test(url);

function RelatedProductCard({ product, lang }: { product: RelatedProduct; lang: string }) {
  const [mediaFailed, setMediaFailed] = useState(false);
  const title = (lang === "th" ? product.title_th : lang === "ro" ? product.title_ro : null) || product.title;
  const media = (product.images ?? []).filter((url): url is string => typeof url === "string" && url.startsWith("https://"));
  // Prefer a real product photo so related cards don't need to load video files.
  const image = media.find((url) => !isVideoUrl(url)) ?? media.find(isVideoUrl);
  const isVideo = Boolean(image && isVideoUrl(image));

  return (
    <Link to="/product/$id" params={{ id: product.id }} className="group min-w-0 overflow-hidden rounded-xl border border-border/70 bg-card transition-colors hover:border-primary/50">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {image && !mediaFailed ? (
          isVideo ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground" aria-label="Product video">
              <span className="flex size-12 items-center justify-center rounded-full border border-border bg-background/80 text-primary">
                <Play className="ml-0.5 h-5 w-5 fill-current" />
              </span>
              <span className="text-xs">View product video</span>
            </div>
          ) : (
            <img
              src={image}
              alt={title}
              loading="lazy"
              onError={() => setMediaFailed(true)}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground" aria-label="Product media unavailable">
            <Package className="h-8 w-8" />
            <span className="text-xs">Preview unavailable</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 min-h-10 break-words text-sm font-medium">{title}</h3>
        <p className="mt-2 font-semibold text-primary">{formatPrice(product.price)}</p>
        <p className="mt-1 text-xs text-muted-foreground">{product.stock} {lang === "th" ? "ชิ้นในสต็อก" : lang === "ro" ? "în stoc" : "in stock"}</p>
      </div>
    </Link>
  );
}

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
        {products.map((product) => <RelatedProductCard key={product.id} product={product} lang={lang} />)}
      </div>
    </section>
  );
}
