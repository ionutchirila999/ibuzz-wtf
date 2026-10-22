import { useCallback, useEffect, useState } from "react";
import { MonitorSmartphone, ShieldCheck, ShieldOff, Trash2, KeyRound, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const COPY = {
  en: {
    title: "Account security", sessions: "Session management", currentSession: "This device / current session",
    browser: "Browser", expires: "Session expires", signOutAll: "Sign out all devices",
    signOutWarning: "This will invalidate sessions on other devices. You will need to sign in again here too.",
    signOutConfirm: "Sign out on all devices, including this one?", signedOut: "Signed out on all devices.",
    securityError: "Security action failed. Please try again.", mfa: "Two-factor authentication (2FA)",
    mfaDesc: "Add an authenticator app for an extra sign-in check.", enableMfa: "Set up authenticator",
    verifyMfa: "Verify and enable 2FA", code: "6-digit authenticator code", secret: "Manual setup key",
    mfaEnabled: "Two-factor authentication is enabled.", disableMfa: "Turn off 2FA",
    mfaDisabled: "Two-factor authentication disabled.", mfaSetupError: "Could not set up 2FA. Please try again.",
    mfaVerifyError: "That code could not be verified. Check the code and try again.",
    deleteTitle: "Delete account", deleteWarning: "Permanently delete your sign-in account and personal profile. Orders are retained for accounting, but customer-identifying fields are anonymized. Support tickets, saved addresses, wishlist entries, and notifications are deleted.",
    typeDelete: "Type DELETE to confirm", deleteButton: "Permanently delete account",
    deleteConfirm: "This is permanent and cannot be undone. Delete your account now?",
    deleteError: "Account deletion could not be completed. Please try again or contact support.",
    deleteNotConfigured: "Account deletion is not configured on the server yet. No account was deleted.",
    deleting: "Deleting account…", loading: "Loading security settings…", noSession: "No active session found.",
    currentDevice: "This browser session", setupHint: "1. Open an authenticator app such as Google Authenticator, Microsoft Authenticator, or 1Password. 2. Scan the QR code below. 3. Enter the current 6-digit code to finish setup.",
    qrAlt: "QR code for setting up two-factor authentication", qrHelp: "If scanning does not work, add an account manually using the setup key below.", cancelSetup: "Cancel setup",
  },
  th: {
    title: "ความปลอดภัยของบัญชี", sessions: "การจัดการเซสชัน", currentSession: "อุปกรณ์นี้ / เซสชันปัจจุบัน",
    browser: "เบราว์เซอร์", expires: "เซสชันหมดอายุ", signOutAll: "ออกจากระบบทุกอุปกรณ์",
    signOutWarning: "เซสชันบนอุปกรณ์อื่นจะถูกยกเลิก และคุณจะต้องเข้าสู่ระบบใหม่บนอุปกรณ์นี้ด้วย",
    signOutConfirm: "ต้องการออกจากระบบทุกอุปกรณ์ รวมถึงอุปกรณ์นี้หรือไม่", signedOut: "ออกจากระบบทุกอุปกรณ์แล้ว",
    securityError: "ดำเนินการด้านความปลอดภัยไม่สำเร็จ โปรดลองอีกครั้ง", mfa: "การยืนยันตัวตนสองขั้นตอน (2FA)",
    mfaDesc: "เพิ่มแอปยืนยันตัวตนเพื่อความปลอดภัยในการเข้าสู่ระบบ", enableMfa: "ตั้งค่าแอปยืนยันตัวตน",
    verifyMfa: "ยืนยันและเปิดใช้ 2FA", code: "รหัส 6 หลักจากแอป", secret: "คีย์ตั้งค่าด้วยตนเอง",
    mfaEnabled: "เปิดใช้การยืนยันตัวตนสองขั้นตอนแล้ว", disableMfa: "ปิด 2FA",
    mfaDisabled: "ปิดการยืนยันตัวตนสองขั้นตอนแล้ว", mfaSetupError: "ตั้งค่า 2FA ไม่สำเร็จ โปรดลองอีกครั้ง",
    mfaVerifyError: "ยืนยันรหัสไม่สำเร็จ โปรดตรวจสอบรหัสแล้วลองใหม่",
    deleteTitle: "ลบบัญชี", deleteWarning: "ลบบัญชีเข้าสู่ระบบและโปรไฟล์ส่วนตัวอย่างถาวร โดยเก็บประวัติคำสั่งซื้อไว้เพื่อการบัญชีและลบข้อมูลที่ระบุตัวลูกค้าออก คำขอช่วยเหลือ ที่อยู่ที่บันทึก รายการโปรด และการแจ้งเตือนจะถูกลบ",
    typeDelete: "พิมพ์ DELETE เพื่อยืนยัน", deleteButton: "ลบบัญชีอย่างถาวร",
    deleteConfirm: "การดำเนินการนี้ไม่สามารถย้อนกลับได้ ต้องการลบบัญชีตอนนี้หรือไม่",
    deleteError: "ลบบัญชีไม่สำเร็จ โปรดลองอีกครั้งหรือติดต่อฝ่ายช่วยเหลือ",
    deleteNotConfigured: "เซิร์ฟเวอร์ยังไม่ได้ตั้งค่าการลบบัญชี จึงไม่มีการลบบัญชีใดๆ",
    deleting: "กำลังลบบัญชี…", loading: "กำลังโหลดการตั้งค่าความปลอดภัย…", noSession: "ไม่พบเซสชันที่ใช้งานอยู่",
    currentDevice: "เซสชันของเบราว์เซอร์นี้", setupHint: "1. เปิดแอปยืนยันตัวตน เช่น Google Authenticator หรือ Microsoft Authenticator 2. สแกน QR ด้านล่าง 3. กรอกรหัส 6 หลักเพื่อเปิดใช้งาน",
    qrAlt: "คิวอาร์โค้ดสำหรับตั้งค่าการยืนยันตัวตนสองขั้นตอน", qrHelp: "หากสแกนไม่ได้ ให้เพิ่มบัญชีด้วยตนเองโดยใช้คีย์ด้านล่าง", cancelSetup: "ยกเลิกการตั้งค่า",
  },
  ro: {
    title: "Securitatea contului", sessions: "Gestionarea sesiunilor", currentSession: "Acest dispozitiv / sesiunea curentă",
    browser: "Browser", expires: "Sesiunea expiră", signOutAll: "Deconectează toate dispozitivele",
    signOutWarning: "Sesiunile de pe celelalte dispozitive vor fi invalidate. Va trebui să te autentifici din nou și aici.",
    signOutConfirm: "Deconectezi toate dispozitivele, inclusiv acesta?", signedOut: "Deconectare de pe toate dispozitivele reușită.",
    securityError: "Acțiunea de securitate a eșuat. Încearcă din nou.", mfa: "Autentificare în doi pași (2FA)",
    mfaDesc: "Adaugă o aplicație de autentificare pentru un control suplimentar la conectare.", enableMfa: "Configurează aplicația",
    verifyMfa: "Verifică și activează 2FA", code: "Codul de 6 cifre din aplicație", secret: "Cheie de configurare manuală",
    mfaEnabled: "Autentificarea în doi pași este activată.", disableMfa: "Dezactivează 2FA",
    mfaDisabled: "Autentificarea în doi pași a fost dezactivată.", mfaSetupError: "Configurarea 2FA a eșuat. Încearcă din nou.",
    mfaVerifyError: "Codul nu a putut fi verificat. Verifică-l și încearcă din nou.",
    deleteTitle: "Șterge contul", deleteWarning: "Șterge definitiv contul de conectare și profilul personal. Comenzile sunt păstrate pentru contabilitate, dar datele care identifică clientul sunt anonimizate. Solicitările de asistență, adresele salvate, favoritele și notificările sunt șterse.",
    typeDelete: "Scrie DELETE pentru confirmare", deleteButton: "Șterge definitiv contul",
    deleteConfirm: "Acțiunea este permanentă și nu poate fi anulată. Ștergi contul acum?",
    deleteError: "Contul nu a putut fi șters. Încearcă din nou sau contactează asistența.",
    deleteNotConfigured: "Ștergerea contului nu este configurată încă pe server. Contul nu a fost șters.",
    deleting: "Se șterge contul…", loading: "Se încarcă setările de securitate…", noSession: "Nu există o sesiune activă.",
    currentDevice: "Sesiunea acestui browser", setupHint: "1. Deschide o aplicație de autentificare, precum Google Authenticator sau Microsoft Authenticator. 2. Scanează codul QR de mai jos. 3. Introdu codul actual de 6 cifre pentru a finaliza configurarea.",
    qrAlt: "Cod QR pentru configurarea autentificării în doi pași", qrHelp: "Dacă scanarea nu funcționează, adaugă manual contul folosind cheia de mai jos.", cancelSetup: "Anulează configurarea",
  },
} as const;

type Factor = { id: string; factor_type: string; status: string; friendly_name?: string };
type PendingTotp = { id: string; qr_code: string; secret: string };

export function AccountSecurity() {
  const { lang } = useT();
  const w = COPY[lang];
  const [loading, setLoading] = useState(true);
  const [sessionExpires, setSessionExpires] = useState<number | null>(null);
  const [browser, setBrowser] = useState("");
  const [factors, setFactors] = useState<Factor[]>([]);
  const [pending, setPending] = useState<PendingTotp | null>(null);
  const [code, setCode] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: sessionData }, { data: factorData, error: factorError }] = await Promise.all([
      supabase.auth.getSession(),
      supabase.auth.mfa.listFactors(),
    ]);
    setSessionExpires(sessionData.session?.expires_at ?? null);
    if (typeof navigator !== "undefined") setBrowser(navigator.userAgent);
    if (!factorError && factorData) setFactors((factorData.totp ?? []) as Factor[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const verifiedFactors = factors.filter(factor => factor.status === "verified");
  const enabled = verifiedFactors.length > 0;

  async function signOutAll() {
    if (!window.confirm(w.signOutConfirm)) return;
    setWorking(true);
    const { error } = await supabase.auth.signOut({ scope: "global" });
    setWorking(false);
    if (error) { toast.error(w.securityError); return; }
    toast.success(w.signedOut);
    window.location.assign("/account");
  }

  async function beginMfa() {
    setWorking(true);
    try {
      // Supabase can leave an unverified factor behind if setup was cancelled or interrupted.
      // Remove stale unverified TOTP factors before creating a fresh enrollment.
      const { data: existing, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;

      const staleFactors = (existing?.all ?? []).filter(
        (factor) => factor.factor_type === "totp" && factor.status !== "verified",
      );
      for (const factor of staleFactors) {
        const { error: cleanupError } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
        if (cleanupError) throw cleanupError;
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "iBuzz.wtf authenticator",
      });
      if (error) throw error;
      if (!data?.totp?.qr_code || !data.totp.secret || !data.id) {
        throw new Error("Supabase did not return complete TOTP enrollment data");
      }
      setPending({ id: data.id, qr_code: data.totp.qr_code, secret: data.totp.secret });
      setCode("");
    } catch (error) {
      console.error("2FA enrollment failed:", error);
      toast.error(w.mfaSetupError);
    } finally {
      setWorking(false);
    }
  }

  async function verifyMfa(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pending || !/^\d{6}$/.test(code.trim())) { toast.error(w.mfaVerifyError); return; }
    setWorking(true);
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: pending.id });
    if (challengeError || !challenge?.id) { setWorking(false); toast.error(w.mfaVerifyError); return; }
    const { error } = await supabase.auth.mfa.verify({ factorId: pending.id, challengeId: challenge.id, code: code.trim() });
    setWorking(false);
    if (error) { toast.error(w.mfaVerifyError); return; }
    setPending(null); setCode("");
    toast.success(w.mfaEnabled);
    await load();
  }

  async function disableMfa() {
    const factor = verifiedFactors[0];
    if (!factor || !window.confirm(w.disableMfa + "?")) return;
    setWorking(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    setWorking(false);
    if (error) { toast.error(w.securityError); return; }
    toast.success(w.mfaDisabled);
    await load();
  }

  async function deleteAccount() {
    if (confirmText !== "DELETE" || !window.confirm(w.deleteConfirm)) return;
    setDeleting(true);
    const { data, error } = await supabase.functions.invoke("delete-account", { body: { confirmation: "DELETE" } });
    setDeleting(false);
    if (error || !data?.success) {
      const message = typeof data?.error === "string" && data.error.toLowerCase().includes("not configured") ? w.deleteNotConfigured : w.deleteError;
      toast.error(message);
      return;
    }
    await supabase.auth.signOut({ scope: "local" });
    window.location.assign("/");
  }

  return <section id="account-security" className="mb-7 scroll-mt-6 rounded-2xl border border-border/50 bg-card/40 p-5 sm:p-6">
    <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></span><div><h2 className="text-xl font-semibold">{w.title}</h2><p className="mt-1 text-sm text-muted-foreground">{w.sessions}</p></div></div>
    {loading ? <p className="mt-4 text-sm text-muted-foreground">{w.loading}</p> : <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <div className="min-w-0 rounded-xl border border-border/50 p-3 sm:p-4">
        <h3 className="flex items-center gap-2 font-semibold"><MonitorSmartphone className="h-4 w-4" />{w.currentSession}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{w.currentDevice}</p>
        <p className="mt-2 break-words text-xs text-muted-foreground">{w.browser}</p>
        <p className="mt-2 text-xs text-muted-foreground">{w.expires}: {sessionExpires ? new Date(sessionExpires * 1000).toLocaleString(lang === "th" ? "th-TH" : lang === "ro" ? "ro-RO" : "en-US") : w.noSession}</p>
        <p className="mt-3 text-sm text-muted-foreground">{w.signOutWarning}</p>
        <Button type="button" variant="outline" className="mt-3" disabled={working} onClick={() => void signOutAll()}><LogOut className="mr-2 h-4 w-4" />{w.signOutAll}</Button>
      </div>
      <div className="rounded-xl border border-border/50 p-4">
        <h3 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" />{w.mfa}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{w.mfaDesc}</p>
        {enabled ? <><p className="mt-3 text-sm text-emerald-600">{w.mfaEnabled}</p><Button type="button" variant="outline" className="mt-3" disabled={working} onClick={() => void disableMfa()}><ShieldOff className="mr-2 h-4 w-4" />{w.disableMfa}</Button></> : pending ? <form onSubmit={verifyMfa} className="mt-4 space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">{w.setupHint}</p>
          <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="rounded-xl border border-border/50 bg-background/50 p-3 text-center">
              <img className="mx-auto block aspect-square w-full max-w-56 rounded-lg bg-white p-2 object-contain" alt={w.qrAlt} src={pending.qr_code} />
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{w.qrHelp}</p>
            </div>
            <div className="min-w-0 space-y-3">
              <div><Label>{w.secret}</Label><p className="mt-1 select-all break-all rounded-lg border border-border/50 bg-muted/50 p-3 font-mono text-sm tracking-wide">{pending.secret}</p></div>
              <div className="space-y-1"><Label htmlFor="mfa-code">{w.code}</Label><Input id="mfa-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} pattern="[0-9]{6}" maxLength={6} placeholder="123456" className="text-center font-mono text-lg tracking-[0.35em]" required /></div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
            <Button type="submit" className="h-auto min-h-10 w-full whitespace-normal px-3 py-2 text-center leading-snug" disabled={working || code.length !== 6}><KeyRound className="mr-2 h-4 w-4 shrink-0" /><span>{w.verifyMfa}</span></Button>
            <Button type="button" variant="outline" className="h-auto min-h-10 w-full whitespace-normal px-3 py-2 text-center leading-snug" disabled={working} onClick={async () => { const { error } = await supabase.auth.mfa.unenroll({ factorId: pending.id }); if (error) { toast.error(w.securityError); return; } setPending(null); setCode(""); await load(); }}>{w.cancelSetup}</Button>
          </div>
        </form> : <Button type="button" className="mt-3" disabled={working} onClick={() => void beginMfa()}><KeyRound className="mr-2 h-4 w-4" />{w.enableMfa}</Button>}
      </div>
    </div>}
    <div className="mt-5 rounded-xl border border-destructive/30 p-4">
      <h3 className="flex items-center gap-2 font-semibold text-destructive"><Trash2 className="h-4 w-4" />{w.deleteTitle}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{w.deleteWarning}</p>
      <div className="mt-3 max-w-sm space-y-1"><Label htmlFor="delete-account-confirm">{w.typeDelete}</Label><Input id="delete-account-confirm" autoComplete="off" value={confirmText} onChange={event => setConfirmText(event.target.value)} /></div>
      <Button type="button" variant="destructive" className="mt-3" disabled={deleting || confirmText !== "DELETE"} onClick={() => void deleteAccount()}><Trash2 className="mr-2 h-4 w-4" />{deleting ? w.deleting : w.deleteButton}</Button>
    </div>
  </section>;
}
