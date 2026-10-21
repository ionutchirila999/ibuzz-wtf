import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, CreditCard, MessageCircle, PackageCheck, RefreshCw, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type NotificationRow = {
  id: string;
  event_type: "order_confirmation" | "payment_update" | "order_update" | "support_reply";
  metadata: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
  order_id: string | null;
  ticket_id: string | null;
};

const COPY = {
  en: {
    title: "Notifications", subtitle: "Order, payment, shipping and support updates.",
    empty: "You're all caught up.", refresh: "Refresh", markAll: "Mark all as read", unread: "unread",
    order_confirmation: "Order confirmed", payment_update: "Payment update", order_update: "Shipping & order update", support_reply: "Shop support replied",
    order: "Order", payment: "Payment status", status: "Order status", tracking: "Tracking number",
    paid: "Paid", pending: "Pending", submitted: "Proof submitted", failed: "Payment failed", refunded: "Refunded",
    received: "Received", confirmed: "Confirmed", processing: "Processing", shipped: "Shipped", ready_for_pickup: "Ready for pickup", completed: "Delivered / completed", cancelled: "Cancelled",
    markRead: "Mark as read", marked: "All notifications marked as read.", failedLoad: "Could not load notifications.", failedRead: "Could not update notification.",
  },
  th: {
    title: "การแจ้งเตือน", subtitle: "อัปเดตคำสั่งซื้อ การชำระเงิน การจัดส่ง และฝ่ายช่วยเหลือ",
    empty: "ไม่มีการแจ้งเตือนใหม่", refresh: "รีเฟรช", markAll: "อ่านทั้งหมดแล้ว", unread: "ยังไม่อ่าน",
    order_confirmation: "ยืนยันคำสั่งซื้อ", payment_update: "อัปเดตการชำระเงิน", order_update: "อัปเดตคำสั่งซื้อและการจัดส่ง", support_reply: "ฝ่ายช่วยเหลือตอบกลับแล้ว",
    order: "คำสั่งซื้อ", payment: "สถานะการชำระเงิน", status: "สถานะคำสั่งซื้อ", tracking: "เลขติดตามพัสดุ",
    paid: "ชำระแล้ว", pending: "รอตรวจสอบ", submitted: "ส่งหลักฐานแล้ว", failed: "ชำระไม่สำเร็จ", refunded: "คืนเงินแล้ว",
    received: "ได้รับคำสั่งซื้อ", confirmed: "ยืนยันแล้ว", processing: "กำลังดำเนินการ", shipped: "จัดส่งแล้ว", ready_for_pickup: "พร้อมรับสินค้า", completed: "จัดส่ง/ดำเนินการเสร็จแล้ว", cancelled: "ยกเลิกแล้ว",
    markRead: "ทำเครื่องหมายว่าอ่านแล้ว", marked: "ทำเครื่องหมายการแจ้งเตือนทั้งหมดว่าอ่านแล้ว", failedLoad: "โหลดการแจ้งเตือนไม่สำเร็จ", failedRead: "อัปเดตการแจ้งเตือนไม่สำเร็จ",
  },
  ro: {
    title: "Notificări", subtitle: "Actualizări despre comenzi, plăți, livrare și asistență.",
    empty: "Nu ai notificări noi.", refresh: "Reîmprospătează", markAll: "Marchează tot ca citit", unread: "necitite",
    order_confirmation: "Comandă confirmată", payment_update: "Actualizare plată", order_update: "Actualizare comandă și livrare", support_reply: "Asistența magazinului a răspuns",
    order: "Comandă", payment: "Starea plății", status: "Starea comenzii", tracking: "Număr de urmărire",
    paid: "Plătită", pending: "În așteptare", submitted: "Dovadă trimisă", failed: "Plată eșuată", refunded: "Rambursată",
    received: "Primită", confirmed: "Confirmată", processing: "În procesare", shipped: "Expediată", ready_for_pickup: "Pregătită pentru ridicare", completed: "Livrată / finalizată", cancelled: "Anulată",
    markRead: "Marchează ca citită", marked: "Toate notificările au fost marcate ca citite.", failedLoad: "Notificările nu au putut fi încărcate.", failedRead: "Notificarea nu a putut fi actualizată.",
  },
} as const;

export function CustomerNotifications() {
  const { lang } = useT();
  const w = COPY[lang];
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const locale = lang === "th" ? "th-TH" : lang === "ro" ? "ro-RO" : "en-US";
  const unreadCount = useMemo(() => rows.filter(row => !row.read_at).length, [rows]);

  const load = useCallback(async (userId?: string) => {
    setLoading(true);
    setError("");
    const { data: auth, error: authError } = await supabase.auth.getUser();
    const ownerId = userId ?? auth.user?.id;
    if (authError || !ownerId) {
      setRows([]);
      setLoading(false);
      if (authError) setError(w.failedLoad);
      return;
    }
    const { data, error: queryError } = await (supabase as any)
      .from("customer_notifications")
      .select("id,event_type,metadata,read_at,created_at,order_id,ticket_id")
      .eq("user_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (queryError) {
      setError(w.failedLoad);
    } else {
      setRows((data ?? []) as NotificationRow[]);
    }
    setLoading(false);
  }, [w.failedLoad]);

  useEffect(() => {
    let alive = true;
    let channel: any;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!alive || !auth.user) {
        if (alive) setLoading(false);
        return;
      }
      await load(auth.user.id);
      if (!alive) return;
      channel = (supabase as any).channel(`customer-notifications-${auth.user.id}`)
        .on("postgres_changes", {
          event: "*", schema: "public", table: "customer_notifications",
          filter: `user_id=eq.${auth.user.id}`,
        }, () => { void load(auth.user.id); })
        .subscribe();
    })();
    return () => {
      alive = false;
      if (channel) void (supabase as any).removeChannel(channel);
    };
  }, [load]);

  async function markRead(id: string) {
    setBusyId(id);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setBusyId(null); return; }
    const { error: updateError } = await (supabase as any).from("customer_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id).eq("user_id", auth.user.id).is("read_at", null);
    setBusyId(null);
    if (updateError) { setError(w.failedRead); return; }
    setRows(current => current.map(row => row.id === id ? { ...row, read_at: new Date().toISOString() } : row));
  }

  async function markAllRead() {
    setNotice("");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const now = new Date().toISOString();
    const { error: updateError } = await (supabase as any).from("customer_notifications")
      .update({ read_at: now }).eq("user_id", auth.user.id).is("read_at", null);
    if (updateError) { setError(w.failedRead); return; }
    setRows(current => current.map(row => row.read_at ? row : { ...row, read_at: now }));
    setNotice(w.marked);
  }

  function label(value: unknown) {
    if (typeof value !== "string" || !value) return "";
    return (w as Record<string, string>)[value] ?? value.replaceAll("_", " ");
  }

  function details(row: NotificationRow) {
    const meta = row.metadata ?? {};
    const orderNumber = typeof meta.order_number === "string" ? meta.order_number : "";
    const status = typeof meta.status === "string" ? meta.status : "";
    const payment = typeof meta.payment_status === "string" ? meta.payment_status : "";
    const tracking = typeof meta.tracking_number === "string" ? meta.tracking_number : "";
    const ticketNumber = typeof meta.ticket_number === "string" ? meta.ticket_number : "";
    const subject = typeof meta.subject === "string" ? meta.subject : "";
    const reply = typeof meta.reply === "string" ? meta.reply : "";
    return <div className="mt-1 space-y-1 text-sm text-muted-foreground">
      {orderNumber && <p>{w.order}: <span className="font-medium text-foreground">{orderNumber}</span></p>}
      {row.event_type === "payment_update" && payment && <p>{w.payment}: <span className="font-medium text-foreground">{label(payment)}</span></p>}
      {row.event_type !== "payment_update" && status && <p>{w.status}: <span className="font-medium text-foreground">{label(status)}</span></p>}
      {tracking && <p>{w.tracking}: <span className="break-all font-medium text-foreground">{tracking}</span></p>}
      {row.event_type === "support_reply" && <><p>{ticketNumber ? `${ticketNumber} · ` : ""}{subject}</p>{reply && <p className="whitespace-pre-wrap break-words rounded-md bg-background/70 p-2 text-foreground">{reply}</p>}</>}
    </div>;
  }

  const Icon = ({ type }: { type: NotificationRow["event_type"] }) => {
    if (type === "payment_update") return <CreditCard className="h-4 w-4" />;
    if (type === "order_update") return <Truck className="h-4 w-4" />;
    if (type === "support_reply") return <MessageCircle className="h-4 w-4" />;
    return <PackageCheck className="h-4 w-4" />;
  };

  return <section id="customer-notifications" className="mb-7 scroll-mt-6 rounded-2xl border border-border/50 bg-card/40 p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="relative mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{unreadCount > 99 ? "99+" : unreadCount}</span>}
        </span>
        <div><h2 className="text-xl font-semibold">{w.title} {unreadCount > 0 && <Badge variant="secondary">{unreadCount} {w.unread}</Badge>}</h2><p className="mt-1 text-sm text-muted-foreground">{w.subtitle}</p></div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => void load()}><RefreshCw className="mr-2 h-3.5 w-3.5" />{w.refresh}</Button>
        {unreadCount > 0 && <Button type="button" size="sm" variant="outline" onClick={() => void markAllRead()}><CheckCheck className="mr-2 h-3.5 w-3.5" />{w.markAll}</Button>}
      </div>
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="mt-3 text-sm text-emerald-600">{notice}</p>}
    {loading ? <p className="py-7 text-center text-sm text-muted-foreground">…</p> : rows.length === 0 ? <div className="mt-4 rounded-xl border border-dashed p-6 text-center"><Bell className="mx-auto h-6 w-6 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">{w.empty}</p></div> : <ul className="mt-4 divide-y divide-border/50">
      {rows.map(row => <li key={row.id} className={`flex gap-3 py-4 first:pt-0 last:pb-0 ${row.read_at ? "opacity-75" : ""}`}>
        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${row.read_at ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}><Icon type={row.event_type} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><p className="font-medium">{w[row.event_type]}</p>{!row.read_at && <Badge variant="secondary">{w.unread}</Badge>}</div>
          {details(row)}
          <p className="mt-2 text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString(locale)}</p>
        </div>
        {!row.read_at && <Button type="button" size="sm" variant="ghost" className="shrink-0 self-start" disabled={busyId === row.id} onClick={() => void markRead(row.id)}>{w.markRead}</Button>}
      </li>)}
    </ul>}
  </section>;
}
