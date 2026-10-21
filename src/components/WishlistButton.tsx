import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function WishlistButton({ productId, compact = false }: { productId: string; compact?: boolean }) {
  const { lang } = useT();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const labels = {
    th: { save: "บันทึกในรายการโปรด", remove: "นำออกจากรายการโปรด", login: "เข้าสู่ระบบเพื่อบันทึกสินค้า", added: "บันทึกสินค้าแล้ว", removed: "นำสินค้าออกจากรายการโปรดแล้ว", error: "ไม่สามารถอัปเดตรายการโปรดได้" },
    en: { save: "Save to wishlist", remove: "Remove from wishlist", login: "Sign in to save products", added: "Product saved to your wishlist", removed: "Product removed from wishlist", error: "Could not update your wishlist" },
    ro: { save: "Salvează la favorite", remove: "Elimină din favorite", login: "Autentifică-te pentru a salva produse", added: "Produs salvat la favorite", removed: "Produs eliminat din favorite", error: "Lista de favorite nu a putut fi actualizată" },
  }[lang];
  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!alive) return;
      const id = data.user?.id ?? null;
      setUserId(id);
      if (id) {
        const { data: row } = await (supabase as any).from("wishlist_items").select("id").eq("user_id", id).eq("product_id", productId).maybeSingle();
        if (alive) setSaved(!!row);
      }
      if (alive) setReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const id = session?.user.id ?? null;
      setUserId(id);
      if (!id) { setSaved(false); setReady(true); return; }
      void (supabase as any).from("wishlist_items").select("id").eq("user_id", id).eq("product_id", productId).maybeSingle()
        .then(({ data }: { data: { id: string } | null }) => { if (alive) { setSaved(!!data); setReady(true); } });
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, [productId]);
  async function toggle() {
    if (!userId) {
      toast.info(labels.login);
      void navigate({ to: "/account" });
      return;
    }
    if (busy) return;
    setBusy(true);
    if (saved) {
      const { error } = await (supabase as any).from("wishlist_items").delete().eq("user_id", userId).eq("product_id", productId);
      setBusy(false);
      if (error) { toast.error(labels.error); return; }
      setSaved(false);
      toast.success(labels.removed);
    } else {
      const { error } = await (supabase as any).from("wishlist_items").upsert({ user_id: userId, product_id: productId }, { onConflict: "user_id,product_id", ignoreDuplicates: true });
      setBusy(false);
      if (error) { toast.error(labels.error); return; }
      setSaved(true);
      toast.success(labels.added);
    }
  }
  return <Button type="button" variant={saved ? "default" : "outline"} size={compact ? "icon" : "default"} disabled={!ready || busy} onClick={(event) => { event.preventDefault(); event.stopPropagation(); void toggle(); }} aria-label={saved ? labels.remove : labels.save} title={saved ? labels.remove : labels.save} className={compact ? "h-10 w-10 rounded-full border-border/70 bg-background/90 shadow-lg backdrop-blur hover:bg-background" : "gap-2"}>
    <Heart className={compact ? "h-4 w-4" : "h-4 w-4"} fill={saved ? "currentColor" : "none"} />
    {!compact && (saved ? labels.remove : labels.save)}
  </Button>;
}
