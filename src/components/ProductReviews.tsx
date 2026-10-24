import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Review = { id: string; rating: number; title: string; body: string; created_at: string };
type EligibleOrder = { order_id: string; order_number: string; created_at: string };

const COPY = {
  en: { title: "Customer reviews", verified: "Verified purchase", empty: "No reviews yet.", signIn: "Sign in to review a product you purchased.", order: "Completed order", rating: "Rating", reviewTitle: "Review title", body: "Your review", submit: "Submit review", sending: "Submitting…", success: "Review published.", failed: "Could not submit the review. You can only review a completed, paid purchase once.", noOrders: "No completed purchase of this product is available to review.", count: "reviews" },
  th: { title: "รีวิวจากลูกค้า", verified: "ยืนยันการซื้อ", empty: "ยังไม่มีรีวิว", signIn: "เข้าสู่ระบบเพื่อรีวิวสินค้าที่คุณซื้อ", order: "คำสั่งซื้อที่เสร็จสิ้น", rating: "คะแนน", reviewTitle: "หัวข้อรีวิว", body: "รีวิวของคุณ", submit: "ส่งรีวิว", sending: "กำลังส่ง…", success: "เผยแพร่รีวิวแล้ว", failed: "ส่งรีวิวไม่ได้ คุณรีวิวได้เฉพาะสินค้าที่ซื้อและชำระเงินแล้ว โดยรีวิวได้หนึ่งครั้งต่อคำสั่งซื้อ", noOrders: "ไม่มีคำสั่งซื้อที่เสร็จสิ้นสำหรับสินค้านี้", count: "รีวิว" },
  ro: { title: "Recenzii clienți", verified: "Achiziție verificată", empty: "Nu există încă recenzii.", signIn: "Autentifică-te pentru a evalua un produs cumpărat.", order: "Comandă finalizată", rating: "Evaluare", reviewTitle: "Titlul recenziei", body: "Recenzia ta", submit: "Trimite recenzia", sending: "Se trimite…", success: "Recenzia a fost publicată.", failed: "Recenzia nu a putut fi trimisă. Poți evalua doar o achiziție plătită și finalizată, o singură dată.", noOrders: "Nu există o comandă finalizată pentru acest produs.", count: "recenzii" },
} as const;

export function ProductReviews({ productId }: { productId: string }) {
  const { lang } = useT();
  const w = COPY[lang];
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState("");
  const [rating, setRating] = useState("5");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setUserId(data.user?.id ?? null);
    });
    return () => { active = false; };
  }, []);

  const reviews = useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("product_reviews")
        .select("id,rating,title,body,created_at")
        .eq("product_id", productId).eq("is_visible", true)
        .order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });

  const eligibleOrders = useQuery({
    queryKey: ["product-review-orders", productId, userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("order_items")
        .select("order_id,orders!inner(order_number,created_at,status,payment_status,user_id)")
        .eq("product_id", productId)
        .eq("orders.user_id", userId)
        .eq("orders.payment_status", "paid")
        .eq("orders.status", "completed")
        .order("created_at", { ascending: false, referencedTable: "orders" });
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        order_id: String(row.order_id),
        order_number: String(row.orders?.order_number ?? row.order_id),
        created_at: String(row.orders?.created_at ?? ""),
      })) as EligibleOrder[];
    },
  });

  useEffect(() => {
    if (!orderId && eligibleOrders.data?.length) setOrderId(eligibleOrders.data[0].order_id);
  }, [orderId, eligibleOrders.data]);

  async function submitReview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userId) { toast.error(w.signIn); return; }
    if (!orderId || title.trim().length < 3 || body.trim().length < 10) { toast.error(w.failed); return; }
    setBusy(true);
    const { error } = await (supabase as any).from("product_reviews").insert({
      product_id: productId,
      order_id: orderId,
      user_id: userId,
      rating: Number(rating),
      title: title.trim(),
      body: body.trim(),
    });
    setBusy(false);
    if (error) { toast.error(w.failed); return; }
    setTitle("");
    setBody("");
    toast.success(w.success);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] }),
      queryClient.invalidateQueries({ queryKey: ["product-review-orders", productId, userId] }),
    ]);
  }

  const average = reviews.data?.length
    ? reviews.data.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.data.length
    : 0;
  const dateLocale = lang === "th" ? "th-TH" : lang === "ro" ? "ro-RO" : "en-US";

  return <section className="mt-5 rounded-2xl border border-border/70 bg-card p-5 sm:p-6" aria-labelledby="product-reviews-title">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 id="product-reviews-title" className="font-semibold tracking-tight">{w.title}</h2>
        {reviews.data?.length ? <p className="mt-1 text-sm text-muted-foreground">{average.toFixed(1)} / 5 · {reviews.data.length} {w.count}</p> : null}
      </div>
      {reviews.data?.length ? <div className="flex gap-0.5" aria-label={`${average.toFixed(1)} out of 5 stars`}>{[1,2,3,4,5].map(n=><Star key={n} className={`h-4 w-4 ${n <= Math.round(average) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}/>)}</div> : null}
    </div>
    {reviews.isLoading ? <p className="mt-4 text-sm text-muted-foreground">…</p> : reviews.error ? <p role="alert" className="mt-4 text-sm text-destructive">{w.failed}</p> : !reviews.data?.length ? <p className="mt-4 text-sm text-muted-foreground">{w.empty}</p> : <div className="mt-4 divide-y divide-border/60">{reviews.data.map(review=><article key={review.id} className="py-4 first:pt-0 last:pb-0"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-medium">{review.title}</h3><p className="mt-1 text-xs text-muted-foreground">{w.verified} · {new Date(review.created_at).toLocaleDateString(dateLocale)}</p></div><div className="flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>{[1,2,3,4,5].map(n=><Star key={n} className={`h-3.5 w-3.5 ${n <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}/>)}</div></div><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{review.body}</p></article>)}</div>}
    <div className="mt-5 border-t border-border/60 pt-5">
      {!userId ? <p className="text-sm text-muted-foreground">{w.signIn}</p> : eligibleOrders.isLoading ? <p className="text-sm text-muted-foreground">…</p> : eligibleOrders.error ? <p role="alert" className="text-sm text-destructive">{w.failed}</p> : !eligibleOrders.data?.length ? <p className="text-sm text-muted-foreground">{w.noOrders}</p> : <form onSubmit={submitReview} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1"><Label>{w.order}</Label><select value={orderId} onChange={e=>setOrderId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">{eligibleOrders.data.map(order=><option key={order.order_id} value={order.order_id}>{order.order_number} · {new Date(order.created_at).toLocaleDateString(dateLocale)}</option>)}</select></div>
          <div className="space-y-1"><Label>{w.rating}</Label><select value={rating} onChange={e=>setRating(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} / 5</option>)}</select></div>
        </div>
        <div className="space-y-1"><Label>{w.reviewTitle}</Label><Input value={title} onChange={e=>setTitle(e.target.value)} minLength={3} maxLength={120} required/></div>
        <div className="space-y-1"><Label>{w.body}</Label><Textarea value={body} onChange={e=>setBody(e.target.value)} minLength={10} maxLength={3000} rows={4} required/></div>
        <Button type="submit" disabled={busy || !orderId}>{busy ? w.sending : w.submit}</Button>
      </form>}
    </div>
  </section>;
}
