import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useT } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, Package, LogOut, Truck, Clock, CheckCircle2 } from 'lucide-react';

export const Route = createFileRoute('/account')({
  staticData: { sitemap: 'exclude-subtree' },
  head: () => ({ meta: [{ title: 'My Account & Orders — iBuzz.wtf' }, { name: 'description', content: 'Sign in to securely track your iBuzz.wtf orders.' }, { name: 'robots', content: 'noindex' }] }),
  component: Account,
});

type OrderItem = { id: string; product_title: string; unit_price: number; quantity: number; line_total: number };
type Order = { id: string; order_number: string; total: number; payment_status: string; status: string; tracking_number: string | null; tracking_url: string | null; created_at: string; order_items: OrderItem[] };

const WORDS = {
  th: { title:'บัญชีของฉัน', lead:'เข้าสู่ระบบหรือสร้างบัญชีเพื่อติดตามคำสั่งซื้อ', email:'อีเมล', password:'รหัสผ่าน', signIn:'เข้าสู่ระบบ', signUp:'สร้างบัญชี', create:'สร้างบัญชีลูกค้า', switchIn:'มีบัญชีแล้ว? เข้าสู่ระบบ', switchUp:'ยังไม่มีบัญชี? สร้างบัญชี', sent:'โปรดตรวจสอบอีเมลเพื่อยืนยันบัญชี ก่อนเข้าสู่ระบบ', orders:'คำสั่งซื้อของฉัน', empty:'ยังไม่มีคำสั่งซื้อ', shop:'เลือกซื้อสินค้า', signOut:'ออกจากระบบ', order:'คำสั่งซื้อ', date:'วันที่', total:'ยอดรวม', payment:'การชำระเงิน', status:'สถานะคำสั่งซื้อ', tracking:'เลขติดตามพัสดุ', track:'ติดตามพัสดุ', items:'รายการสินค้า', pending:'รอตรวจสอบ', submitted:'ส่งหลักฐานแล้ว', paid:'ชำระแล้ว', failed:'ชำระไม่สำเร็จ', refunded:'คืนเงินแล้ว', received:'ได้รับคำสั่งซื้อ', confirmed:'ยืนยันแล้ว', processing:'กำลังดำเนินการ', shipped:'จัดส่งแล้ว', ready_for_pickup:'พร้อมรับสินค้า', completed:'เสร็จสิ้น', cancelled:'ยกเลิกแล้ว', loading:'กำลังโหลด…', error:'ไม่สามารถโหลดคำสั่งซื้อได้ กรุณาลองใหม่', signInRequired:'เข้าสู่ระบบเพื่อดูคำสั่งซื้อของคุณ' },
  en: { title:'My Account', lead:'Sign in or create an account to track your orders.', email:'Email', password:'Password', signIn:'Sign in', signUp:'Create account', create:'Create customer account', switchIn:'Already have an account? Sign in', switchUp:'New here? Create an account', sent:'Check your email to confirm your account before signing in.', orders:'My Orders', empty:'No orders yet.', shop:'Browse Market', signOut:'Sign out', order:'Order', date:'Date', total:'Total', payment:'Payment', status:'Order status', tracking:'Tracking number', track:'Track shipment', items:'Items', pending:'Pending verification', submitted:'Proof submitted', paid:'Paid', failed:'Payment failed', refunded:'Refunded', received:'Order received', confirmed:'Confirmed', processing:'Processing', shipped:'Shipped', ready_for_pickup:'Ready for pickup', completed:'Completed', cancelled:'Cancelled', loading:'Loading orders…', error:'Could not load orders. Please try again.', signInRequired:'Sign in to view your orders.' },
  ro: { title:'Contul meu', lead:'Autentifică-te sau creează un cont pentru a urmări comenzile.', email:'E-mail', password:'Parolă', signIn:'Autentificare', signUp:'Creează cont', create:'Creează cont de client', switchIn:'Ai deja un cont? Autentifică-te', switchUp:'Cont nou? Creează unul', sent:'Verifică e-mailul pentru a confirma contul înainte de autentificare.', orders:'Comenzile mele', empty:'Nu ai încă nicio comandă.', shop:'Vezi produsele', signOut:'Deconectare', order:'Comandă', date:'Data', total:'Total', payment:'Plată', status:'Starea comenzii', tracking:'Număr de urmărire', track:'Urmărește coletul', items:'Produse', pending:'În așteptarea verificării', submitted:'Dovadă trimisă', paid:'Plătit', failed:'Plată eșuată', refunded:'Rambursat', received:'Comandă primită', confirmed:'Confirmată', processing:'În procesare', shipped:'Expediată', ready_for_pickup:'Pregătită pentru ridicare', completed:'Finalizată', cancelled:'Anulată', loading:'Se încarcă comenzile…', error:'Comenzile nu au putut fi încărcate. Încearcă din nou.', signInRequired:'Autentifică-te pentru a vedea comenzile.' },
} as const;

function Account() {
  const { lang } = useT();
  const w = WORDS[lang];
  const navigate = useNavigate();
  const [sessionLoading, setSessionLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'in'|'up'>('in');
  const [userEmail, setUserEmail] = useState<string|null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadOrders() {
    setLoadingOrders(true); setError('');
    const { data, error: queryError } = await (supabase as any).from('orders').select('id,order_number,total,payment_status,status,tracking_number,tracking_url,created_at,order_items(id,product_title,unit_price,quantity,line_total)').order('created_at', { ascending: false });
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
      if (data.session?.user) void loadOrders();
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
      if (session?.user) void loadOrders();
      else setOrders([]);
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, [lang]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    const result = mode === 'in'
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin + '/account' } });
    setBusy(false);
    if (result.error) { setError(result.error.message); return; }
    if (mode === 'up' && !result.data.session) { setNotice(w.sent); return; }
    setUserEmail(result.data.user?.email ?? email.trim());
    await loadOrders();
  }

  async function signOut() { await supabase.auth.signOut(); setUserEmail(null); setOrders([]); }
  const label = (value: string) => (w as unknown as Record<string, string>)[value] ?? value.replaceAll('_', ' ');
  const money = (value: number) => new Intl.NumberFormat(lang === 'th' ? 'th-TH' : lang === 'ro' ? 'ro-RO' : 'en-US', { style: 'currency', currency: 'THB', maximumFractionDigits: 2 }).format(Number(value));

  if (sessionLoading) return <main className="mx-auto max-w-5xl px-5 py-16"><p className="text-muted-foreground">{w.loading}</p></main>;
  return <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="section-eyebrow">iBuzz.wtf</p><h1 className="section-heading mt-3">{w.title}</h1><p className="mt-3 text-sm text-muted-foreground">{w.lead}</p></div>{userEmail && <Button variant="outline" onClick={() => void signOut()}><LogOut className="mr-2 h-4 w-4"/>{w.signOut}</Button>}</div>
    {!userEmail ? <section className="mx-auto mt-8 max-w-md rounded-xl border border-border/50 bg-card/40 p-5 sm:p-7">
      <div className="mb-5 flex gap-2"><Button variant={mode==='in'?'default':'outline'} className="flex-1" onClick={() => {setMode('in');setError('');setNotice('');}}>{w.signIn}</Button><Button variant={mode==='up'?'default':'outline'} className="flex-1" onClick={() => {setMode('up');setError('');setNotice('');}}>{w.signUp}</Button></div>
      <form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="account-email">{w.email}</Label><Input id="account-email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></div><div className="space-y-2"><Label htmlFor="account-password">{w.password}</Label><Input id="account-password" type="password" autoComplete={mode==='up'?'new-password':'current-password'} minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required/></div><Button className="w-full" variant="glow" type="submit" disabled={busy}>{busy ? w.loading : mode==='up'?w.create:w.signIn}</Button></form>
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}{notice && <p role="status" className="mt-4 text-sm text-muted-foreground">{notice}</p>}
      <p className="mt-5 text-center text-sm text-muted-foreground"><button className="underline underline-offset-4" onClick={()=>setMode(mode==='in'?'up':'in')}>{mode==='in'?w.switchUp:w.switchIn}</button></p>
    </section> : <section className="mt-8"><div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><span>{userEmail}</span><span>·</span><span>{w.orders}</span></div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}
      {loadingOrders ? <p className="py-10 text-center text-muted-foreground">{w.loading}</p> : orders.length === 0 ? <div className="rounded-xl border border-dashed p-10 text-center"><Package className="mx-auto h-9 w-9 text-muted-foreground"/><p className="mt-3 font-medium">{w.empty}</p><Button asChild className="mt-5"><Link to="/shop">{w.shop}<ArrowUpRight className="ml-2 h-4 w-4"/></Link></Button></div> : <div className="space-y-4">{orders.map(order => <article key={order.id} className="rounded-xl border border-border/50 bg-card/40 p-4 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">{w.order} · {order.order_number}</p><h2 className="mt-1 text-lg font-bold">{money(order.total)}</h2><p className="mt-1 text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString(lang==='th'?'th-TH':lang==='ro'?'ro-RO':'en-US')}</p></div><div className="flex flex-wrap gap-2"><Badge variant={order.status==='completed'?'default':order.status==='cancelled'?'destructive':'secondary'}>{label(order.status)}</Badge><Badge variant={order.payment_status==='paid'?'default':'outline'}>{label(order.payment_status)}</Badge></div></div>
        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_220px]"><div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{w.items}</p><ul className="space-y-2">{(order.order_items??[]).map(item=><li key={item.id} className="flex justify-between gap-3 text-sm"><span>{item.product_title} × {item.quantity}</span><span className="shrink-0">{money(item.line_total)}</span></li>)}</ul></div><div className="rounded-lg bg-muted/40 p-3"><p className="text-xs text-muted-foreground">{w.status}</p><div className="mt-2 flex items-center gap-2 text-sm font-semibold"><Clock className="h-4 w-4 text-primary-soft"/>{label(order.status)}</div><p className="mt-4 text-xs text-muted-foreground">{w.payment}</p><p className="mt-1 text-sm">{label(order.payment_status)}</p>{order.tracking_number && <div className="mt-4 border-t border-border/30 pt-3"><p className="text-xs text-muted-foreground">{w.tracking}</p><p className="mt-1 break-all text-sm font-medium">{order.tracking_number}</p>{order.tracking_url && <a className="mt-2 inline-flex items-center text-sm text-primary underline" href={order.tracking_url} target="_blank" rel="noopener noreferrer">{w.track}<Truck className="ml-1 h-4 w-4"/></a>}</div>}</div></div>
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/30 pt-4 text-xs text-muted-foreground"><CheckCircle2 className="h-4 w-4"/>{w.status}: {label(order.status)}</div>
      </article>)}</div>}
    </section>}
  </main>;
}
