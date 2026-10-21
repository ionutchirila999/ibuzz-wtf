import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Heart, MapPin, UserRound, Bell, ShieldCheck, Trash2 } from "lucide-react";

type Product = { id: string; title: string; title_th: string | null; title_ro: string | null; price: number; status: string; images: string[]; stock: number };
type SavedProduct = { id: string; product_id: string; created_at: string; products: Product | null };

const COPY = {
  en: {
    profile:"Personal profile & delivery", name:"Full name", phone:"Phone number", address:"Delivery address", language:"Preferred language", save:"Save profile", saved:"Profile saved.", profileError:"Could not save profile.",
    wishlist:"Saved products", search:"Search products to save", add:"Save", remove:"Remove", noSaved:"No saved products yet.", noMatches:"No matching available products.", stock:"In stock", sold:"Unavailable", loading:"Loading…", loadError:"Could not load saved products. Check that the wishlist migration has been applied.",
    updates:"Account updates", orderUpdate:"Order", ticketUpdate:"Support reply", noUpdates:"No recent updates.", security:"Session security", signOutAll:"Sign out all devices", signOutConfirm:"This signs your account out on other devices too.", signedOut:"Signed out of all devices.", securityError:"Could not sign out all devices.", th:"Thai", en:"English", ro:"Romanian"
  },
  th: {
    profile:"โปรไฟล์และที่อยู่จัดส่ง", name:"ชื่อ-นามสกุล", phone:"หมายเลขโทรศัพท์", address:"ที่อยู่จัดส่ง", language:"ภาษาที่ต้องการ", save:"บันทึกโปรไฟล์", saved:"บันทึกโปรไฟล์แล้ว", profileError:"ไม่สามารถบันทึกโปรไฟล์ได้",
    wishlist:"สินค้าที่บันทึกไว้", search:"ค้นหาสินค้าเพื่อบันทึก", add:"บันทึก", remove:"นำออก", noSaved:"ยังไม่มีสินค้าที่บันทึกไว้", noMatches:"ไม่พบสินค้าที่พร้อมจำหน่าย", stock:"มีสินค้า", sold:"ไม่มีจำหน่าย", loading:"กำลังโหลด…", loadError:"โหลดสินค้าที่บันทึกไม่ได้ โปรดตรวจสอบว่าได้ใช้ wishlist migration แล้ว",
    updates:"การอัปเดตบัญชี", orderUpdate:"คำสั่งซื้อ", ticketUpdate:"คำตอบจากฝ่ายช่วยเหลือ", noUpdates:"ไม่มีการอัปเดตล่าสุด", security:"ความปลอดภัยของเซสชัน", signOutAll:"ออกจากระบบทุกอุปกรณ์", signOutConfirm:"ระบบจะออกจากบัญชีนี้บนอุปกรณ์อื่นด้วย", signedOut:"ออกจากระบบทุกอุปกรณ์แล้ว", securityError:"ไม่สามารถออกจากระบบทุกอุปกรณ์ได้", th:"ไทย", en:"อังกฤษ", ro:"โรมาเนีย"
  },
  ro: {
    profile:"Profil personal și livrare", name:"Nume complet", phone:"Număr de telefon", address:"Adresă de livrare", language:"Limba preferată", save:"Salvează profilul", saved:"Profil salvat.", profileError:"Profilul nu a putut fi salvat.",
    wishlist:"Produse salvate", search:"Caută produse de salvat", add:"Salvează", remove:"Elimină", noSaved:"Nu ai produse salvate.", noMatches:"Nu există produse disponibile potrivite.", stock:"În stoc", sold:"Indisponibil", loading:"Se încarcă…", loadError:"Produsele salvate nu s-au putut încărca. Verifică migrarea listei de dorințe.",
    updates:"Actualizări cont", orderUpdate:"Comandă", ticketUpdate:"Răspuns asistență", noUpdates:"Nu există actualizări recente.", security:"Securitatea sesiunii", signOutAll:"Deconectează toate dispozitivele", signOutConfirm:"Contul va fi deconectat și de pe celelalte dispozitive.", signedOut:"Toate dispozitivele au fost deconectate.", securityError:"Nu s-a putut deconecta toate dispozitivele.", th:"Thailandeză", en:"Engleză", ro:"Română"
  }
} as const;

export function CustomerAccountExtras() {
  const { lang } = useT();
  const w = COPY[lang];
  const qc = useQueryClient();
  const [userId, setUserId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<"th" | "en" | "ro">(lang);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!alive || error || !data.user) return;
      const user = data.user;
      setUserId(user.id);
      setFullName(String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? ""));
      setPhone(String(user.user_metadata?.phone ?? ""));
      setAddress(String(user.user_metadata?.delivery_address ?? ""));
      const pref = user.user_metadata?.preferred_language;
      setPreferredLanguage(pref === "en" || pref === "ro" || pref === "th" ? pref : lang);
    });
    return () => { alive = false; };
  }, [lang]);

  const saved = useQuery({
    queryKey: ["customer-wishlist", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("customer_wishlist")
        .select("id,product_id,created_at,products(id,title,title_th,title_ro,price,status,images,stock)")
        .eq("user_id", userId).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SavedProduct[];
    }
  });
  const products = useQuery({
    queryKey: ["wishlist-product-search"],
    enabled: !!userId && search.trim().length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase.from("products")
        .select("id,title,title_th,title_ro,price,status,images,stock")
        .neq("status", "hidden").limit(200);
      if (error) throw error;
      return (data ?? []) as Product[];
    }
  });
  const tickets = useQuery({
    queryKey: ["customer-account-updates", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("support_tickets")
        .select("id,subject,status,admin_reply,replied_at,updated_at")
        .eq("user_id", userId).not("admin_reply", "is", null)
        .order("replied_at", { ascending: false }).limit(5);
      if (error) throw error;
      return data ?? [];
    }
  });
  const searchResults = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    const savedIds = new Set((saved.data ?? []).map(item => item.product_id));
    return (products.data ?? []).filter(p => {
      if (savedIds.has(p.id) || p.status !== "available" || p.stock < 1) return false;
      const title = [p.title, p.title_th, p.title_ro].filter(Boolean).join(" ").toLocaleLowerCase();
      return title.includes(term);
    }).slice(0, 5);
  }, [products.data, saved.data, search]);
  const productTitle = (p: Product) => (lang === "th" ? p.title_th : lang === "ro" ? p.title_ro : null) || p.title;

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userId) return;
    if (fullName.trim().length < 2 || fullName.trim().length > 100 || phone.trim().length > 40 || address.trim().length > 500) {
      toast.error(w.profileError);
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: {
      full_name: fullName.trim(), phone: phone.trim(), delivery_address: address.trim(), preferred_language: preferredLanguage
    }});
    setSaving(false);
    if (error) { toast.error(w.profileError); return; }
    toast.success(w.saved);
  }

  async function addProduct(productId: string) {
    if (!userId) return;
    const { error } = await (supabase as any).from("customer_wishlist").insert({ user_id: userId, product_id: productId });
    if (error) { toast.error(error.code === "23505" ? w.saved : w.loadError); return; }
    setSearch("");
    await qc.invalidateQueries({ queryKey: ["customer-wishlist", userId] });
  }

  async function removeProduct(id: string) {
    const { error } = await (supabase as any).from("customer_wishlist").delete().eq("id", id).eq("user_id", userId);
    if (error) { toast.error(w.loadError); return; }
    await qc.invalidateQueries({ queryKey: ["customer-wishlist", userId] });
  }

  async function signOutAll() {
    if (!window.confirm(w.signOutConfirm)) return;
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) { toast.error(w.securityError); return; }
    toast.success(w.signedOut);
    window.location.assign("/account");
  }

  return <div className="mt-8 grid gap-5 lg:grid-cols-2">
    <section className="rounded-2xl border border-border/50 bg-card/40 p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><UserRound className="h-5 w-5 text-primary" />{w.profile}</h2>
      <form onSubmit={saveProfile} className="mt-4 space-y-3">
        <div className="space-y-1.5"><Label htmlFor="customer-full-name">{w.name}</Label><Input id="customer-full-name" value={fullName} onChange={e => setFullName(e.target.value)} maxLength={100} required /></div>
        <div className="space-y-1.5"><Label htmlFor="customer-phone">{w.phone}</Label><Input id="customer-phone" type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} maxLength={40} /></div>
        <div className="space-y-1.5"><Label htmlFor="customer-address">{w.address}</Label><textarea id="customer-address" value={address} onChange={e => setAddress(e.target.value)} maxLength={500} rows={3} autoComplete="street-address" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
        <div className="space-y-1.5"><Label htmlFor="customer-language">{w.language}</Label><select id="customer-language" value={preferredLanguage} onChange={e => setPreferredLanguage(e.target.value as "th" | "en" | "ro")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="th">{w.th}</option><option value="en">{w.en}</option><option value="ro">{w.ro}</option></select></div>
        <Button type="submit" disabled={saving || !userId}>{saving ? w.loading : w.save}</Button>
      </form>
    </section>

    <section className="rounded-2xl border border-border/50 bg-card/40 p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><Heart className="h-5 w-5 text-primary" />{w.wishlist}</h2>
      <div className="mt-4 space-y-3">
        <div className="space-y-1.5"><Label htmlFor="wishlist-search">{w.search}</Label><Input id="wishlist-search" value={search} onChange={e => setSearch(e.target.value)} placeholder={w.search} /></div>
        {search.trim().length >= 2 && <div className="space-y-2">{products.isFetching ? <p className="text-sm text-muted-foreground">{w.loading}</p> : searchResults.length ? searchResults.map(p => <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border p-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{productTitle(p)}</p><p className="text-xs text-muted-foreground">฿{Number(p.price).toLocaleString()}</p></div><Button size="sm" type="button" onClick={() => void addProduct(p.id)}>{w.add}</Button></div>) : <p className="text-sm text-muted-foreground">{w.noMatches}</p>}</div>}
        {saved.isLoading ? <p className="text-sm text-muted-foreground">{w.loading}</p> : saved.error ? <p role="alert" className="text-sm text-destructive">{w.loadError}</p> : !saved.data?.length ? <p className="text-sm text-muted-foreground">{w.noSaved}</p> : <div className="space-y-2">{saved.data.map(item => item.products && <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">{item.products.images?.[0] && <img src={item.products.images[0]} alt="" className="h-14 w-14 rounded-md object-cover" /> }<div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{productTitle(item.products)}</p><p className="text-xs text-muted-foreground">฿{Number(item.products.price).toLocaleString()} · {item.products.status === "available" && item.products.stock > 0 ? w.stock : w.sold}</p></div><Button type="button" variant="ghost" size="icon" aria-label={w.remove} onClick={() => void removeProduct(item.id)}><Trash2 className="h-4 w-4" /></Button></div>)}</div>}
      </div>
    </section>

    <section className="rounded-2xl border border-border/50 bg-card/40 p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><Bell className="h-5 w-5 text-primary" />{w.updates}</h2>
      {tickets.isLoading ? <p className="mt-3 text-sm text-muted-foreground">{w.loading}</p> : tickets.error ? <p role="alert" className="mt-3 text-sm text-destructive">{w.noUpdates}</p> : !tickets.data?.length ? <p className="mt-3 text-sm text-muted-foreground">{w.noUpdates}</p> : <ul className="mt-3 space-y-3">{tickets.data.map((ticket: any) => <li key={ticket.id} className="rounded-lg bg-muted/30 p-3"><p className="text-sm font-medium">{w.ticketUpdate}: {ticket.subject}</p><p className="mt-1 text-sm text-muted-foreground">{ticket.admin_reply}</p><p className="mt-1 text-xs text-muted-foreground">{ticket.replied_at ? new Date(ticket.replied_at).toLocaleString(lang === "th" ? "th-TH" : lang === "ro" ? "ro-RO" : "en-US") : ""}</p></li>)}</ul>}
    </section>

    <section className="rounded-2xl border border-border/50 bg-card/40 p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck className="h-5 w-5 text-primary" />{w.security}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{w.signOutConfirm}</p>
      <Button type="button" variant="outline" className="mt-4" onClick={() => void signOutAll()}>{w.signOutAll}</Button>
    </section>
  </div>;
}
