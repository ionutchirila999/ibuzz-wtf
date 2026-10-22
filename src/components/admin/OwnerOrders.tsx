import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/shop';
import { Check, ExternalLink, Package, Printer, Search, RotateCcw } from 'lucide-react';

const STATUSES = ['received', 'confirmed', 'processing', 'shipped', 'ready_for_pickup', 'completed', 'cancelled'];
const PAYMENTS = ['pending', 'submitted', 'paid', 'failed', 'refunded'];
type OrderRow = { id: string; order_number: string; buyer_name: string; buyer_contact: string; total: number; payment_status: string; status: string; tracking_number: string | null; tracking_url: string | null; created_at: string; order_items: { id: string; product_title: string; unit_price: number; quantity: number; line_total: number }[] };
type RefundRow = { id: string; order_id: string; amount: number; reason: string; created_at: string };

export function OwnerOrders() {
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, { status: string; payment_status: string; tracking_number: string; tracking_url: string }>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [printOrderId, setPrintOrderId] = useState<string | null>(null);
  const [refundDrafts, setRefundDrafts] = useState<Record<string, { amount: string; reason: string }>>({});
  const orders = useQuery({
    queryKey: ['owner-orders'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderRow[];
    },
  });
  const refunds = useQuery({ queryKey: ['owner-refunds'], queryFn: async () => { const { data, error } = await (supabase as any).from('order_refunds').select('id,order_id,amount,reason,created_at').order('created_at',{ascending:false}); if (error) throw error; return (data ?? []) as RefundRow[]; }, retry: false });
  async function recordRefund(order: OrderRow) {
    const draft = refundDrafts[order.id] ?? { amount: '', reason: '' };
    const amount = Number(draft.amount);
    if (!Number.isFinite(amount) || amount <= 0 || draft.reason.trim().length < 3) { toast.error('Enter a valid refund amount and reason.'); return; }
    const { error } = await (supabase as any).rpc('record_order_refund', { p_order_id: order.id, p_amount: amount, p_reason: draft.reason.trim() });
    if (error) { toast.error(error.message || 'Could not record refund.'); return; }
    toast.success('Refund recorded. This records a refund already processed; it does not send money.');
    setRefundDrafts(old => { const next = { ...old }; delete next[order.id]; return next; });
    await Promise.all([qc.invalidateQueries({ queryKey: ['owner-orders'] }), qc.invalidateQueries({ queryKey: ['owner-refunds'] })]);
  }
  const filteredOrders = useMemo(() => (orders.data ?? []).filter(order => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || [order.order_number, order.buyer_name, order.buyer_contact].some(value => String(value ?? '').toLowerCase().includes(q));
    return matchesSearch && (statusFilter === 'all' || order.status === statusFilter) && (paymentFilter === 'all' || order.payment_status === paymentFilter);
  }), [orders.data, search, statusFilter, paymentFilter]);

  function draft(order: OrderRow) {
    return drafts[order.id] ?? { status: order.status, payment_status: order.payment_status, tracking_number: order.tracking_number ?? '', tracking_url: order.tracking_url ?? '' };
  }
  function setDraft(order: OrderRow, field: keyof ReturnType<typeof draft>, value: string) {
    setDrafts(old => ({ ...old, [order.id]: { ...draft(order), [field]: value } }));
  }
  async function save(order: OrderRow) {
    const d = draft(order);
    if (d.tracking_url && !/^https:\/\//i.test(d.tracking_url)) { toast.error('Tracking URL must start with https://'); return; }
    const { error } = await (supabase as any).from('orders').update({
      status: d.status,
      payment_status: d.payment_status,
      tracking_number: d.tracking_number.trim() || null,
      tracking_url: d.tracking_url.trim() || null,
      updated_at: new Date().toISOString(),
    }).eq('id', order.id);
    if (error) { toast.error('Could not update order. Check admin access.'); return; }
    toast.success('Order updated');
    setDrafts(old => { const next = { ...old }; delete next[order.id]; return next; });
    await qc.invalidateQueries({ queryKey: ['owner-orders'] });
    await qc.invalidateQueries({ queryKey: ['customer-orders'] });
  }

  if (orders.isLoading) return <p className="py-8 text-center text-muted-foreground">Loading orders…</p>;
  if (orders.error) return <p role="alert" className="py-8 text-center text-destructive">Could not load orders. Confirm the order-tracking migration has been applied.</p>;
  if (!orders.data?.length) return <div className="rounded-xl border border-dashed p-10 text-center"><Package className="mx-auto h-8 w-8 text-muted-foreground"/><p className="mt-3 font-medium">No customer orders yet.</p><p className="mt-1 text-sm text-muted-foreground">New orders saved at checkout will appear here.</p></div>;

  return <div className="mt-4 space-y-4 print:space-y-0">
    <div className="grid gap-3 rounded-xl border bg-card p-3 sm:grid-cols-[minmax(0,1fr)_180px_180px] print:hidden">
      <label className="relative block"><span className="sr-only">Search orders</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search order number, customer or contact" className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground"/></label>
      <label className="text-xs text-muted-foreground">Order status<select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"><option value="all">All order statuses</option>{STATUSES.map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select></label>
      <label className="text-xs text-muted-foreground">Payment status<select value={paymentFilter} onChange={e=>setPaymentFilter(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"><option value="all">All payment statuses</option>{PAYMENTS.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
      <p className="text-xs text-muted-foreground sm:col-span-3">Showing {filteredOrders.length} of {orders.data.length} orders</p>
    </div>
    {filteredOrders.length===0 ? <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No orders match these filters.</div> : filteredOrders.map(order => {
    const d = draft(order);
    return <article key={order.id} className={`rounded-xl border bg-card p-4 sm:p-5 print:rounded-none print:border-0 print:p-0 ${printOrderId && printOrderId !== order.id ? 'hidden print:hidden' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">iBuzz.wtf · {order.order_number} · {new Date(order.created_at).toLocaleString()}</p><h3 className="mt-1 text-lg font-bold">{formatPrice(order.total)}</h3><p className="mt-1 text-sm">{order.buyer_name} · {order.buyer_contact}</p></div><div className="flex gap-2"><Badge variant="secondary">{order.status}</Badge><Badge variant={order.payment_status === 'paid' ? 'default' : 'outline'}>{order.payment_status}</Badge></div></div>
      <ul className="mt-4 space-y-1 border-t pt-3 text-sm">{(order.order_items ?? []).map(item => <li key={item.id} className="flex justify-between gap-3"><span>{item.product_title} × {item.quantity}</span><span>{formatPrice(item.line_total)}</span></li>)}</ul>
      <div className="mt-4 rounded-lg border border-border/50 p-3 print:hidden"><div className="flex items-center justify-between gap-2"><h4 className="text-sm font-semibold">Refund records</h4><span className="text-xs text-muted-foreground">{formatPrice((refunds.data??[]).filter(r=>r.order_id===order.id).reduce((sum,r)=>sum+Number(r.amount),0))} of {formatPrice(order.total)} refunded</span></div>{(refunds.data??[]).filter(r=>r.order_id===order.id).map(r=><div key={r.id} className="mt-2 flex flex-wrap justify-between gap-2 border-t pt-2 text-xs"><span>{new Date(r.created_at).toLocaleString()} · {r.reason}</span><strong>{formatPrice(Number(r.amount))}</strong></div>)}{refunds.error&&<p className="mt-2 text-xs text-destructive">Refund records require the latest database migration to be applied.</p>}<form onSubmit={e=>{e.preventDefault();void recordRefund(order);}} className="mt-3 grid gap-2 sm:grid-cols-[140px_minmax(0,1fr)_auto]"><input type="number" min="0.01" max={Math.max(0,order.total-(refunds.data??[]).filter(r=>r.order_id===order.id).reduce((sum,r)=>sum+Number(r.amount),0))} step="0.01" required value={refundDrafts[order.id]?.amount??''} onChange={e=>setRefundDrafts(old=>({...old,[order.id]:{amount:e.target.value,reason:old[order.id]?.reason??''}}))} placeholder="Amount (฿)" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"/><input required minLength={3} maxLength={1000} value={refundDrafts[order.id]?.reason??''} onChange={e=>setRefundDrafts(old=>({...old,[order.id]:{amount:old[order.id]?.amount??'',reason:e.target.value}}))} placeholder="Reason (already refunded)" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"/><Button type="submit" size="sm" variant="outline" disabled={!!refunds.error}><RotateCcw className="mr-1 h-4 w-4"/>Record refund</Button></form><p className="mt-2 text-xs text-muted-foreground">Records a completed refund only; no payment is initiated from this screen.</p></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1 text-xs text-muted-foreground">Fulfilment status<select value={d.status} onChange={e => setDraft(order,'status',e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">{STATUSES.map(s => <option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select></label>
        <label className="space-y-1 text-xs text-muted-foreground">Payment status<select value={d.payment_status} onChange={e => setDraft(order,'payment_status',e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">{PAYMENTS.map(s => <option key={s} value={s}>{s}</option>)}</select></label>
        <label className="space-y-1 text-xs text-muted-foreground">Tracking number<input value={d.tracking_number} onChange={e => setDraft(order,'tracking_number',e.target.value)} placeholder="Tracking number" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"/></label>
        <label className="space-y-1 text-xs text-muted-foreground">Tracking URL<input value={d.tracking_url} onChange={e => setDraft(order,'tracking_url',e.target.value)} placeholder="https://…" inputMode="url" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"/></label>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 print:hidden"><span className="text-xs text-muted-foreground">Order and payment status are tracked separately.</span><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => { setPrintOrderId(order.id); window.onafterprint = () => { setPrintOrderId(null); window.onafterprint = null; }; window.setTimeout(() => window.print(), 100); }}><Printer className="mr-1 h-4 w-4"/>Print receipt</Button>{d.tracking_url && /^https:\/\//i.test(d.tracking_url) && <Button asChild variant="outline" size="sm"><a href={d.tracking_url} target="_blank" rel="noopener noreferrer">Test tracking link <ExternalLink className="ml-1 h-3.5 w-3.5"/></a></Button>}<Button size="sm" onClick={() => void save(order)}><Check className="mr-1 h-4 w-4"/>Save updates</Button></div></div>
    </article>;
  })}</div>;
}
