import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createLovableAuth } from '@lovable.dev/cloud-auth-js';
import { useT } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, Package, LogOut, Truck, Clock, CheckCircle2 } from 'lucide-react';
import { CustomerOrderDetails } from '@/components/account/CustomerOrderDetails';
import { safeTrackingUrl } from '@/lib/tracking';

export const Route = createFileRoute('/account')({
  staticData: { sitemap: 'exclude-subtree' },
  head: () => ({ meta: [{ title: 'My Account & Orders — iBuzz.wtf' }, { name: 'description', content: 'Sign in to securely track your iBuzz.wtf orders.' }, { name: 'robots', content: 'noindex' }] }),
  component: Account,
});

type OrderItem = { id: string; product_title: string; unit_price: number; quantity: number; line_total: number };
type Order = { id: string; order_number: string; total: number; payment_status: string; status: string; tracking_number: string | null; tracking_url: string | null; created_at: string; order_items: OrderItem[] };

const WORDS = {
  th: { changeEmail:'เปลี่ยนอีเมล', newEmail:'อีเมลใหม่', saveEmail:'ส่งคำขอเปลี่ยนอีเมล', emailChangeSent:'ส่งลิงก์ยืนยันไปยังอีเมลใหม่แล้ว โปรดเปิดลิงก์เพื่อยืนยันการเปลี่ยนแปลง', emailChangeError:'ไม่สามารถส่งคำขอเปลี่ยนอีเมลได้', forgotPassword:'ลืมรหัสผ่าน?', resetSent:'ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลแล้ว โปรดตรวจสอบกล่องจดหมาย', resetError:'ไม่สามารถส่งลิงก์รีเซ็ตรหัสผ่านได้', changePassword:'เปลี่ยนรหัสผ่าน', newPassword:'รหัสผ่านใหม่', confirmPassword:'ยืนยันรหัสผ่านใหม่', savePassword:'บันทึกรหัสผ่าน', passwordUpdated:'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว', passwordMismatch:'รหัสผ่านไม่ตรงกัน', passwordMin:'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร', title:'บัญชีของฉัน', lead:'เข้าสู่ระบบหรือสร้างบัญชีเพื่อติดตามคำสั่งซื้อ', email:'อีเมล', password:'รหัสผ่าน', signIn:'เข้าสู่ระบบ', signUp:'สร้างบัญชี', create:'สร้างบัญชีลูกค้า', switchIn:'มีบัญชีแล้ว? เข้าสู่ระบบ', switchUp:'ยังไม่มีบัญชี? สร้างบัญชี', sent:'โปรดตรวจสอบอีเมลเพื่อยืนยันบัญชี ก่อนเข้าสู่ระบบ', orders:'คำสั่งซื้อของฉัน', empty:'ยังไม่มีคำสั่งซื้อ', shop:'เลือกซื้อสินค้า', signOut:'ออกจากระบบ', order:'คำสั่งซื้อ', date:'วันที่', total:'ยอดรวม', payment:'การชำระเงิน', status:'สถานะคำสั่งซื้อ', tracking:'เลขติดตามพัสดุ', track:'ติดตามพัสดุ', items:'รายการสินค้า', pending:'รอตรวจสอบ', submitted:'ส่งหลักฐานแล้ว', paid:'ชำระแล้ว', failed:'ชำระไม่สำเร็จ', refunded:'คืนเงินแล้ว', received:'ได้รับคำสั่งซื้อ', confirmed:'ยืนยันแล้ว', processing:'กำลังดำเนินการ', shipped:'จัดส่งแล้ว', ready_for_pickup:'พร้อมรับสินค้า', completed:'เสร็จสิ้น', cancelled:'ยกเลิกแล้ว', loading:'กำลังโหลด…', error:'ไม่สามารถโหลดคำสั่งซื้อได้ กรุณาลองใหม่', signInRequired:'เข้าสู่ระบบเพื่อดูคำสั่งซื้อของคุณ' },
  en: { changeEmail:'Change email', newEmail:'New email address', saveEmail:'Request email change', emailChangeSent:'A confirmation link was sent to your new email. Open it to confirm the change.', emailChangeError:'Could not request an email change. Please try again.', forgotPassword:'Forgot password?', resetSent:'Password reset link sent. Check your email inbox.', resetError:'Could not send the password reset email. Please try again.', changePassword:'Change password', newPassword:'New password', confirmPassword:'Confirm new password', savePassword:'Update password', passwordUpdated:'Password updated successfully.', passwordMismatch:'Passwords do not match.', passwordMin:'Password must be at least 8 characters.', title:'My Account', lead:'Sign in or create an account to track your orders.', email:'Email', password:'Password', signIn:'Sign in', signUp:'Create account', create:'Create customer account', switchIn:'Already have an account? Sign in', switchUp:'New here? Create an account', sent:'Check your email to confirm your account before signing in.', orders:'My Orders', empty:'No orders yet.', shop:'Browse Market', signOut:'Sign out', order:'Order', date:'Date', total:'Total', payment:'Payment', status:'Order status', tracking:'Tracking number', track:'Track shipment', items:'Items', pending:'Pending verification', submitted:'Proof submitted', paid:'Paid', failed:'Payment failed', refunded:'Refunded', received:'Order received', confirmed:'Confirmed', processing:'Processing', shipped:'Shipped', ready_for_pickup:'Ready for pickup', completed:'Completed', cancelled:'Cancelled', loading:'Loading orders…', error:'Could not load orders. Please try again.', signInRequired:'Sign in to view your orders.' },
  ro: { changeEmail:'Schimbă e-mailul', newEmail:'Adresă de e-mail nouă', saveEmail:'Solicită schimbarea e-mailului', emailChangeSent:'Un link de confirmare a fost trimis la noua adresă. Deschide-l pentru a confirma schimbarea.', emailChangeError:'Nu s-a putut solicita schimbarea e-mailului. Încearcă din nou.', forgotPassword:'Ai uitat parola?', resetSent:'Linkul de resetare a fost trimis. Verifică e-mailul.', resetError:'Nu s-a putut trimite e-mailul de resetare. Încearcă din nou.', changePassword:'Schimbă parola', newPassword:'Parolă nouă', confirmPassword:'Confirmă parola nouă', savePassword:'Actualizează parola', passwordUpdated:'Parola a fost actualizată cu succes.', passwordMismatch:'Parolele nu coincid.', passwordMin:'Parola trebuie să aibă cel puțin 8 caractere.', title:'Contul meu', lead:'Autentifică-te sau creează un cont pentru a urmări comenzile.', email:'E-mail', password:'Parolă', signIn:'Autentificare', signUp:'Creează cont', create:'Creează cont de client', switchIn:'Ai deja un cont? Autentifică-te', switchUp:'Cont nou? Creează unul', sent:'Verifică e-mailul pentru a confirma contul înainte de autentificare.', orders:'Comenzile mele', empty:'Nu ai încă nicio comandă.', shop:'Vezi produsele', signOut:'Deconectare', order:'Comandă', date:'Data', total:'Total', payment:'Plată', status:'Starea comenzii', tracking:'Număr de urmărire', track:'Urmărește coletul', items:'Produse', pending:'În așteptarea verificării', submitted:'Dovadă trimisă', paid:'Plătit', failed:'Plată eșuată', refunded:'Rambursat', received:'Comandă primită', confirmed:'Confirmată', processing:'În procesare', shipped:'Expediată', ready_for_pickup:'Pregătită pentru ridicare', completed:'Finalizată', cancelled:'Anulată', loading:'Se încarcă comenzile…', error:'Comenzile nu au putut fi încărcate. Încearcă din nou.', signInRequired:'Autentifică-te pentru a vedea comenzile.' },
} as const;

function Account() {
  const { lang } = useT();
  const w = WORDS[lang];
  const navigate = useNavigate();
  const [sessionLoading, setSessionLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'in'|'up'>('in');
  const [resetMode, setResetMode] = useState(false);
  const [userEmail, setUserEmail] = useState<string|null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailPanelOpen, setEmailPanelOpen] = useState(false);
  const [passwordPanelOpen, setPasswordPanelOpen] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('resetPassword') === '1');

  async function loadOrders(userId?: string) {
    setLoadingOrders(true); setError('');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const ownerId = userId ?? authData.user?.id;
    if (authError || !ownerId) { setOrders([]); setLoadingOrders(false); return; }
    // Always scope customer order reads to the authenticated account; never depend on RLS alone.
    const { data, error: queryError } = await (supabase as any).from('orders').select('id,order_number,total,payment_status,status,tracking_number,tracking_url,created_at,order_items(id,product_title,unit_price,quantity,line_total)').eq('user_id', ownerId).order('created_at', { ascending: false });
    if (queryError) { setError(w.error); setOrders([]); }
    else setOrders((data ?? []) as Order[]);
    setLoadingOrders(false);
  }

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setUserEmail(data.session?.user.email ?? null);
      setSessionLoading(false);
      if (data.session?.user) void loadOrders(data.session.user.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
      if (session?.user) void loadOrders(session.user.id);
      else setOrders([]);
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, [lang]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    if (resetMode) {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + '/account?resetPassword=1' });
      setBusy(false);
      if (resetError) { setError(w.resetError); return; }
      setNotice(w.resetSent);
      return;
    }
    const result = mode === 'in'
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin + '/account' } });
    setBusy(false);
    if (result.error) { setError(result.error.message); return; }
    if (mode === 'up' && !result.data.session) { setNotice(w.sent); return; }
    setUserEmail(result.data.user?.email ?? email.trim());
    await loadOrders(result.data.user?.id);
  }

  async function signInWithProvider(provider: 'google') {
    setBusy(true); setError(''); setNotice('');
    const lovableAuth = createLovableAuth();
    const result = await lovableAuth.signInWithOAuth(provider, { redirect_uri: window.location.origin + '/account' });
    if (result.redirected) return;
    if (result.error) { setBusy(false); setError(result.error.message); return; }
    const { error: authError } = await supabase.auth.setSession(result.tokens);
    if (authError) { setBusy(false); setError(authError.message); return; }
    setUserEmail((await supabase.auth.getUser()).data.user?.email ?? null);
    await loadOrders((await supabase.auth.getUser()).data.user?.id);
    setBusy(false);
  }

  async function updatePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(''); setNotice('');
    if (newPassword.length < 8) { setError(w.passwordMin); return; }
    if (newPassword !== confirmPassword) { setError(w.passwordMismatch); return; }
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setBusy(false);
    if (updateError) { setError(updateError.message); return; }
    setNewPassword(''); setConfirmPassword(''); setPasswordPanelOpen(false); setNotice(w.passwordUpdated);
  }
  async function updateEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(''); setNotice('');
    const requestedEmail = newEmail.trim().toLowerCase();
    if (!requestedEmail || requestedEmail === userEmail?.toLowerCase()) {
      setError(w.emailChangeError);
      return;
    }
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser(
      { email: requestedEmail },
      { emailRedirectTo: window.location.origin + '/account' },
    );
    setBusy(false);
    if (updateError) { setError(updateError.message || w.emailChangeError); return; }
    setNewEmail(''); setEmailPanelOpen(false); setNotice(w.emailChangeSent);
  }
  async function signOut() { await supabase.auth.signOut(); setUserEmail(null); setOrders([]); setPasswordPanelOpen(false); }
  const label = (value: string) => (w as unknown as Record<string, string>)[value] ?? value.replaceAll('_', ' ');
  const money = (value: number) => new Intl.NumberFormat(lang === 'th' ? 'th-TH' : lang === 'ro' ? 'ro-RO' : 'en-US', { style: 'currency', currency: 'THB', maximumFractionDigits: 2 }).format(Number(value));

  if (sessionLoading) return <main className="mx-auto max-w-5xl px-5 py-16"><p className="text-muted-foreground">{w.loading}</p></main>;
  return <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="section-eyebrow">iBuzz.wtf</p><h1 className="section-heading mt-3">{w.title}</h1><p className="mt-3 text-sm text-muted-foreground">{userEmail ? (lang === 'th' ? 'จัดการบัญชีและติดตามคำสั่งซื้อของคุณได้ที่นี่' : lang === 'ro' ? 'Gestionează-ți contul și urmărește comenzile aici.' : 'Manage your account and track your orders here.') : w.lead}</p></div>{userEmail && <Button variant="outline" onClick={() => void signOut()}><LogOut className="mr-2 h-4 w-4"/>{w.signOut}</Button>}</div>
    {!userEmail ? <section className="auth-panel mx-auto mt-8 max-w-md overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-xl shadow-black/5">
      {!resetMode && <div className="grid grid-cols-2 gap-1 border-b border-border/60 bg-muted/35 p-2" role="tablist" aria-label={lang === 'th' ? 'การเข้าถึงบัญชี' : lang === 'ro' ? 'Acces la cont' : 'Account access'}>
        <button type="button" role="tab" aria-selected={mode === 'in'} className={`relative overflow-hidden rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 hover:-translate-y-0.5 active:translate-y-0 ${mode === 'in' ? 'border-cyan-300/70 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.22),inset_0_0_12px_rgba(99,102,241,0.18)] hover:shadow-[0_0_26px_rgba(34,211,238,0.38)]' : 'border-border/70 bg-slate-950/70 text-slate-300 hover:border-cyan-300/50 hover:bg-slate-900 hover:text-cyan-100 hover:shadow-[0_0_16px_rgba(34,211,238,0.16)]'}`} onClick={() => {setMode('in');setError('');setNotice('');}}>{w.signIn}</button>
        <button type="button" role="tab" aria-selected={mode === 'up'} className={`relative overflow-hidden rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300 hover:-translate-y-0.5 active:translate-y-0 ${mode === 'up' ? 'border-fuchsia-300/70 bg-gradient-to-r from-slate-950 via-purple-950 to-slate-900 text-fuchsia-100 shadow-[0_0_18px_rgba(217,70,239,0.22),inset_0_0_12px_rgba(168,85,247,0.18)] hover:shadow-[0_0_26px_rgba(217,70,239,0.38)]' : 'border-border/70 bg-slate-950/70 text-slate-300 hover:border-fuchsia-300/50 hover:bg-slate-900 hover:text-fuchsia-100 hover:shadow-[0_0_16px_rgba(217,70,239,0.16)]'}`} onClick={() => {setMode('up');setError('');setNotice('');}}>{w.signUp}</button>
      </div>}
      <div className="p-5 sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{lang === 'th' ? 'ยินดีต้อนรับสู่ iBuzz' : lang === 'ro' ? 'Bine ai venit la iBuzz' : 'WELCOME TO IBUZZ'}</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">{resetMode ? w.forgotPassword : mode === 'up' ? w.create : w.signIn}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{resetMode ? (lang === 'th' ? 'กรอกอีเมลเพื่อรับลิงก์รีเซ็ตรหัสผ่าน' : lang === 'ro' ? 'Introdu e-mailul pentru a primi un link de resetare.' : 'Enter your email and we’ll send a password reset link.') : mode === 'up' ? (lang === 'th' ? 'สร้างบัญชีเพื่อติดตามคำสั่งซื้อและจัดการการซื้อของคุณ' : lang === 'ro' ? 'Creează un cont pentru a urmări și gestiona comenzile.' : 'Create an account to track and manage your orders.') : (lang === 'th' ? 'เข้าสู่ระบบเพื่อดูคำสั่งซื้อและติดตามพัสดุ' : lang === 'ro' ? 'Autentifică-te pentru a vedea comenzile și livrările.' : 'Sign in to view your orders and track deliveries.')}</p>
        </div>
        {!resetMode && <div className="mb-5 grid grid-cols-1 gap-2"><Button type="button" variant="outline" className="auth-social-button w-full" disabled={busy} onClick={() => void signInWithProvider('google')}><span className="google-mark" aria-hidden="true">G</span>Continue with Google</Button></div>}
        {!resetMode && <div className="mb-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /><span>{lang === 'th' ? 'หรือใช้อีเมล' : lang === 'ro' ? 'sau folosește e-mailul' : 'or continue with email'}</span><span className="h-px flex-1 bg-border" /></div>}
        <form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="account-email">{w.email}</Label><Input id="account-email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></div>{!resetMode && <div className="space-y-2"><Label htmlFor="account-password">{w.password}</Label><Input id="account-password" type="password" autoComplete={mode==='up'?'new-password':'current-password'} minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required/></div>}<Button className="group relative w-full overflow-hidden rounded-xl border border-cyan-300/60 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 font-semibold tracking-wide text-cyan-50 shadow-[0_0_20px_rgba(34,211,238,0.2),inset_0_0_14px_rgba(99,102,241,0.16)] transition-all duration-300 before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent before:transition-transform before:duration-700 hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:before:translate-x-full active:translate-y-0 disabled:hover:translate-y-0 disabled:hover:shadow-none" variant="glow" type="submit" disabled={busy}>{busy ? w.loading : resetMode ? w.forgotPassword : mode==='up'?w.create:w.signIn}</Button></form>
        {!resetMode && mode==='in' && <p className="mt-3 text-right"><button type="button" className="text-sm font-medium text-primary underline-offset-4 hover:underline" onClick={()=>{setResetMode(true);setError('');setNotice('');}}>{w.forgotPassword}</button></p>}
        {resetMode && <p className="mt-4 text-center text-sm"><button type="button" className="font-medium text-primary underline-offset-4 hover:underline" onClick={()=>{setResetMode(false);setError('');setNotice('');}}>{w.signIn}</button></p>}
        {error && <p role="alert" className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}{notice && <p role="status" className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">{notice}</p>}
        {!resetMode && <p className="mt-6 border-t border-border/60 pt-5 text-center text-sm text-muted-foreground">{mode === 'in' ? w.switchUp : w.switchIn} <button type="button" className="ml-1 font-semibold text-primary underline-offset-4 hover:underline" onClick={()=>{setMode(mode==='in'?'up':'in');setError('');setNotice('');}}>{mode === 'in' ? w.signUp : w.signIn}</button></p>}
      </div>
    </section> : <section className="mt-8"><div className="mb-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/50 bg-card/30 p-5"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">{lang === 'th' ? 'แดชบอร์ดลูกค้า' : lang === 'ro' ? 'Panou client' : 'Customer dashboard'}</p><p className="mt-2 text-sm text-muted-foreground">{userEmail}</p></div><Button asChild variant="outline" size="sm"><Link to="/shop">{w.shop}<ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button></div>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/50 bg-card/40 p-4">
          <p className="text-sm text-muted-foreground">{w.orders}</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{orders.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">{lang === 'th' ? 'คำสั่งซื้อทั้งหมด' : lang === 'ro' ? 'Comenzi în total' : 'All your orders'}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/40 p-4">
          <p className="text-sm text-muted-foreground">{lang === 'th' ? 'กำลังดำเนินการ' : lang === 'ro' ? 'În curs' : 'In progress'}</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{orders.filter(order => !['completed', 'cancelled'].includes(order.status)).length}</p>
          <p className="mt-1 text-xs text-muted-foreground">{lang === 'th' ? 'คำสั่งซื้อที่ยังไม่เสร็จสิ้น' : lang === 'ro' ? 'Comenzi nefinalizate' : 'Orders not yet completed'}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/40 p-4">
          <p className="text-sm text-muted-foreground">{lang === 'th' ? 'จัดส่งแล้ว' : lang === 'ro' ? 'Expediate' : 'Shipped'}</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{orders.filter(order => ['shipped', 'ready_for_pickup', 'completed'].includes(order.status)).length}</p>
          <p className="mt-1 text-xs text-muted-foreground">{lang === 'th' ? 'รวมคำสั่งซื้อที่เสร็จสิ้น' : lang === 'ro' ? 'Inclusiv comenzile finalizate' : 'Including completed orders'}</p>
        </div>
        <button type="button" onClick={() => document.getElementById('customer-orders')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="flex flex-col justify-between rounded-xl border border-primary/30 bg-primary/5 p-4 text-left transition-colors hover:border-primary/60 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <div><p className="text-sm font-medium">{lang === 'th' ? 'ต้องการความช่วยเหลือ?' : lang === 'ro' ? 'Ai nevoie de ajutor?' : 'Need help?'}</p><p className="mt-1 text-xs text-muted-foreground">{lang === 'th' ? 'ไปที่คำสั่งซื้อเพื่อเปิดคำขอช่วยเหลือ' : lang === 'ro' ? 'Mergi la comenzi pentru a contacta asistența' : 'Go to your orders to open a support request'}</p></div>
          <span className="mt-3 inline-flex items-center text-xs font-medium text-primary">{lang === 'th' ? 'ดูคำสั่งซื้อและขอความช่วยเหลือ' : lang === 'ro' ? 'Vezi comenzile și cere ajutor' : 'View orders and get support'} <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></span>
        </button>
      </div>
      <div id="customer-orders" className="mb-6 flex scroll-mt-6 flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{w.orders}</h2>
        <Button type="button" size="sm" variant="outline" disabled={loadingOrders} onClick={() => void loadOrders()}>{lang === 'th' ? 'รีเฟรชคำสั่งซื้อ' : lang === 'ro' ? 'Reîncarcă comenzile' : 'Refresh orders'}</Button>
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}
      {loadingOrders ? <p className="py-10 text-center text-muted-foreground">{w.loading}</p> : orders.length === 0 ? <div className="rounded-xl border border-dashed p-10 text-center"><Package className="mx-auto h-9 w-9 text-muted-foreground"/><p className="mt-3 font-medium">{w.empty}</p><Button asChild className="mt-5"><Link to="/shop">{w.shop}<ArrowUpRight className="ml-2 h-4 w-4"/></Link></Button></div> : <div className="space-y-4">{orders.map(order => <article key={order.id} className="rounded-xl border border-border/50 bg-card/40 p-4 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">{w.order} · {order.order_number}</p><h2 className="mt-1 text-lg font-bold">{money(order.total)}</h2><p className="mt-1 text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString(lang==='th'?'th-TH':lang==='ro'?'ro-RO':'en-US')}</p></div><div className="flex flex-wrap gap-2"><Badge variant={order.status==='completed'?'default':order.status==='cancelled'?'destructive':'secondary'}>{label(order.status)}</Badge><Badge variant={order.payment_status==='paid'?'default':'outline'}>{label(order.payment_status)}</Badge></div></div>
        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_220px]"><div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{w.items}</p><ul className="space-y-2">{(order.order_items??[]).map(item=><li key={item.id} className="flex justify-between gap-3 text-sm"><span>{item.product_title} × {item.quantity}</span><span className="shrink-0">{money(item.line_total)}</span></li>)}</ul></div><div className="rounded-lg bg-muted/40 p-3"><p className="text-xs text-muted-foreground">{w.status}</p><div className="mt-2 flex items-center gap-2 text-sm font-semibold"><Clock className="h-4 w-4 text-primary-soft"/>{label(order.status)}</div><p className="mt-4 text-xs text-muted-foreground">{w.payment}</p><p className="mt-1 text-sm">{label(order.payment_status)}</p>{order.tracking_number && <div className="mt-4 border-t border-border/30 pt-3"><p className="text-xs text-muted-foreground">{w.tracking}</p><p className="mt-1 break-all text-sm font-medium">{order.tracking_number}</p>{safeTrackingUrl(order.tracking_url) && <a className="mt-2 inline-flex items-center text-sm text-primary underline" href={safeTrackingUrl(order.tracking_url)!} target="_blank" rel="noopener noreferrer">{w.track}<Truck className="ml-1 h-4 w-4"/></a>}</div>}</div></div>
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/30 pt-4 text-xs text-muted-foreground"><CheckCircle2 className="h-4 w-4"/>{w.status}: {label(order.status)}</div>
        <CustomerOrderDetails order={order} />
      </article>)}</div>}
      <div className="mt-12 rounded-2xl border border-border/50 bg-muted/15 p-5 sm:p-6"><div className="mb-5 flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><LogOut className="h-5 w-5 rotate-180" /></div><div><p className="section-eyebrow">{lang === 'th' ? 'การตั้งค่า' : lang === 'ro' ? 'Setări' : 'SETTINGS'}</p><h2 className="mt-1 text-xl font-semibold">{lang === 'th' ? 'บัญชีและความปลอดภัย' : lang === 'ro' ? 'Cont și securitate' : 'Account & security'}</h2><p className="mt-1 text-sm text-muted-foreground">{lang === 'th' ? 'จัดการอีเมลและรหัสผ่านของคุณ' : lang === 'ro' ? 'Gestionează adresa de e-mail și parola.' : 'Manage your email address and password.'}</p></div></div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-border/50 bg-card/40 p-4 sm:p-5">
        <p className="mb-3 text-sm text-muted-foreground">{userEmail}</p>
        <Button type="button" variant="outline" onClick={() => { setEmailPanelOpen(v => !v); setError(""); setNotice(""); }}>{w.changeEmail}</Button>
        {emailPanelOpen && <form onSubmit={updateEmail} className="mt-4 grid gap-3">
          <div className="space-y-2"><Label htmlFor="new-account-email">{w.newEmail}</Label><Input id="new-account-email" type="email" autoComplete="email" value={newEmail} onChange={e=>setNewEmail(e.target.value)} required /></div>
          <Button type="submit" disabled={busy}>{busy ? w.loading : w.saveEmail}</Button>
        </form>}
      </div>
      <div className="rounded-xl border border-border/50 bg-card/40 p-4 sm:p-5">
        <Button type="button" variant="outline" onClick={() => { setPasswordPanelOpen(v => !v); setError(""); setNotice(""); }}>{w.changePassword}</Button>
        {passwordPanelOpen && <form onSubmit={updatePassword} className="mt-4 grid gap-3 sm:max-w-md">
          <div className="space-y-2"><Label htmlFor="new-account-password">{w.newPassword}</Label><Input id="new-account-password" type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={e=>setNewPassword(e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="confirm-account-password">{w.confirmPassword}</Label><Input id="confirm-account-password" type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required /></div>
          <Button type="submit" disabled={busy}>{busy ? w.loading : w.savePassword}</Button>
        </form>}
        {notice && <p role="status" className="mt-3 text-sm text-muted-foreground">{notice}</p>}
      </div>
      </div>
      </div>
    </section>}
  </main>;
}
