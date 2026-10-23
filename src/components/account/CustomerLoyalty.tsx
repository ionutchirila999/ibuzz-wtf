import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Copy, Sparkles } from "lucide-react";

type LoyaltyAccount = { points_balance: number; referral_code: string };

export function CustomerLoyalty() {
  const { lang } = useT();
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [rewardCode, setRewardCode] = useState("");

  async function loadAccount() {
    const { data, error } = await (supabase as any).rpc("ibuzz_get_my_loyalty_account");
    if (error) {
      setAccount(null);
    } else {
      const row = Array.isArray(data) ? data[0] : data;
      if (row && typeof row.referral_code === "string") setAccount({ points_balance: Number(row.points_balance) || 0, referral_code: row.referral_code });
    }
    setLoading(false);
  }

  useEffect(() => { void loadAccount(); }, []);

  async function applyCode() {
    if (!code.trim()) return;
    setApplying(true);
    const { error } = await (supabase as any).rpc("ibuzz_apply_referral_code", { p_code: code.trim().toUpperCase() });
    setApplying(false);
    if (error) {
      toast.error(error.message || (lang === "th" ? "ใช้รหัสแนะนำไม่สำเร็จ" : lang === "ro" ? "Codul de recomandare nu a putut fi aplicat" : "Could not apply referral code"));
      return;
    }
    toast.success(lang === "th" ? "ใช้รหัสแนะนำแล้ว รับคะแนนโบนัสเมื่อคำสั่งซื้อแรกเสร็จสมบูรณ์" : lang === "ro" ? "Cod aplicat. Primești puncte bonus după prima comandă finalizată." : "Referral code applied. Bonus points arrive after your first completed order.");
    setCode("");
  }

  async function redeemPoints() {
    if (!account || account.points_balance < 100 || redeeming) return;
    setRedeeming(true);
    const { data, error } = await (supabase as any).rpc("ibuzz_redeem_loyalty_points", { p_points: 100 });
    setRedeeming(false);
    if (error || typeof data !== "string") {
      toast.error(error?.message || (lang === "th" ? "แลกคะแนนไม่สำเร็จ" : lang === "ro" ? "Punctele nu au putut fi răscumpărate" : "Could not redeem points"));
      return;
    }
    setRewardCode(data);
    await loadAccount();
    toast.success(lang === "th" ? "สร้างรหัสส่วนลด ฿10 แล้ว ใช้ได้ครั้งเดียวภายใน 30 วัน" : lang === "ro" ? "Codul de reducere de 10 ฿ a fost creat. O singură utilizare în 30 de zile." : "Created a ฿10 discount code, valid for one use within 30 days.");
  }

  async function copyRewardCode() {
    if (!rewardCode) return;
    try {
      await navigator.clipboard.writeText(rewardCode);
      toast.success(lang === "th" ? "คัดลอกรหัสส่วนลดแล้ว" : lang === "ro" ? "Codul de reducere a fost copiat" : "Discount code copied");
    } catch {
      toast.error(lang === "th" ? "คัดลอกไม่สำเร็จ" : lang === "ro" ? "Copierea a eșuat" : "Could not copy code");
    }
  }

  async function copyCode() {
    if (!account) return;
    try {
      await navigator.clipboard.writeText(account.referral_code);
      toast.success(lang === "th" ? "คัดลอกรหัสแล้ว" : lang === "ro" ? "Cod copiat" : "Referral code copied");
    } catch {
      toast.error(lang === "th" ? "คัดลอกไม่สำเร็จ" : lang === "ro" ? "Copierea a eșuat" : "Could not copy code");
    }
  }

  if (loading || !account) return null;

  return (
    <section className="mb-5 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary"><Gift className="h-5 w-5" /></div>
          <div className="min-w-0">
            <h2 className="font-semibold">{lang === "th" ? "iBuzz Rewards" : lang === "ro" ? "Recompense iBuzz" : "iBuzz Rewards"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{lang === "th" ? "รับ 1 คะแนนทุกยอดซื้อ ฿100 ที่ชำระและเสร็จสมบูรณ์" : lang === "ro" ? "Câștigi 1 punct pentru fiecare 100 ฿ dintr-o comandă plătită și finalizată." : "Earn 1 point for every ฿100 in paid, completed orders."}</p>
          </div>
        </div>
        <div className="shrink-0 text-right"><p className="text-xs text-muted-foreground">{lang === "th" ? "คะแนนของคุณ" : lang === "ro" ? "Punctele tale" : "Your points"}</p><p className="mt-1 flex items-center justify-end gap-1 text-2xl font-bold"><Sparkles className="h-5 w-5 text-primary" />{account.points_balance}</p></div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/70 p-3">
        <div><p className="text-sm font-semibold">{lang === "th" ? "แลก 100 คะแนนเป็นส่วนลด ฿10" : lang === "ro" ? "Schimbă 100 de puncte pentru o reducere de 10 ฿" : "Redeem 100 points for ฿10 off"}</p><p className="mt-1 text-xs text-muted-foreground">{lang === "th" ? "รหัสใช้ได้ครั้งเดียวและหมดอายุใน 30 วัน" : lang === "ro" ? "Codul poate fi folosit o dată și expiră în 30 de zile." : "One-time code; expires in 30 days."}</p></div>
        <Button type="button" variant="outline" disabled={redeeming || account.points_balance < 100} onClick={() => void redeemPoints()}>{redeeming ? "…" : lang === "th" ? "แลกคะแนน" : lang === "ro" ? "Răscumpără" : "Redeem points"}</Button>
      </div>
      {rewardCode && <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3"><div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">{lang === "th" ? "รหัสส่วนลดของคุณ" : lang === "ro" ? "Codul tău de reducere" : "Your discount code"}</p><code className="break-all font-semibold">{rewardCode}</code></div><Button type="button" size="sm" variant="outline" onClick={() => void copyRewardCode()}><Copy className="mr-2 h-4 w-4"/>{lang === "th" ? "คัดลอก" : lang === "ro" ? "Copiază" : "Copy code"}</Button></div>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border/60 bg-background/70 p-3">
          <p className="text-xs text-muted-foreground">{lang === "th" ? "รหัสแนะนำของคุณ" : lang === "ro" ? "Codul tău de recomandare" : "Your referral code"}</p>
          <div className="mt-2 flex items-center gap-2"><code className="min-w-0 flex-1 break-all font-semibold">{account.referral_code}</code><Button type="button" variant="outline" size="icon" aria-label="Copy referral code" onClick={() => void copyCode()}><Copy className="h-4 w-4" /></Button></div>
          <p className="mt-2 text-xs text-muted-foreground">{lang === "th" ? "เพื่อนของคุณรับ 50 คะแนน และคุณรับ 100 คะแนน เมื่อคำสั่งซื้อแรกของเพื่อนเสร็จสมบูรณ์" : lang === "ro" ? "Prietenul primește 50 de puncte, iar tu 100 după prima lui comandă finalizată." : "Your friend gets 50 points and you get 100 when their first order is completed."}</p>
        </div>
        <form onSubmit={e => { e.preventDefault(); void applyCode(); }} className="space-y-2 rounded-lg border border-border/60 bg-background/70 p-3">
          <label className="block text-xs text-muted-foreground">{lang === "th" ? "มีรหัสแนะนำจากเพื่อนหรือไม่?" : lang === "ro" ? "Ai un cod de recomandare?" : "Have a friend's referral code?"}</label>
          <div className="flex gap-2"><Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={30} placeholder="IBZ…" /><Button type="submit" disabled={applying || !code.trim()}>{applying ? "…" : lang === "th" ? "ใช้รหัส" : lang === "ro" ? "Aplică" : "Apply"}</Button></div>
          <p className="text-xs text-muted-foreground">{lang === "th" ? "ใช้ได้ครั้งเดียวก่อนรับคะแนนจากคำสั่งซื้อแรก" : lang === "ro" ? "Poate fi folosit o singură dată, înainte de prima comandă finalizată." : "Apply once before your first completed order."}</p>
        </form>
      </div>
    </section>
  );
}
