import { useEffect, useState, type FormEvent } from "react";
import { MessageSquareText, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type RequestType = "question" | "issue" | "cancellation";
type SupportRequest = { id: string; request_type: RequestType; subject: string; status: string; created_at: string };

const COPY = {
  en: { title: "Order support", question: "Ask a question", issue: "Report an issue", cancellation: "Request cancellation", subject: "Subject", message: "Details", subjectHint: "Briefly describe your request", messageHint: "Explain your question or issue in detail", submit: "Submit request", sending: "Sending…", sent: "Support request submitted.", error: "Could not submit your request. Please try again.", min: "Enter at least 10 characters of detail.", paidNotice: "Paid-order cancellation requests are reviewed by our team. Your order will not be cancelled or refunded automatically.", history: "Your requests", open: "Open", in_review: "In review", waiting_for_customer: "Waiting for you", resolved: "Resolved", rejected: "Declined", close: "Close" },
  th: { title: "ติดต่อเกี่ยวกับคำสั่งซื้อ", question: "สอบถามเกี่ยวกับคำสั่งซื้อ", issue: "แจ้งปัญหา", cancellation: "ขอยกเลิกคำสั่งซื้อ", subject: "หัวข้อ", message: "รายละเอียด", subjectHint: "สรุปคำขอของคุณ", messageHint: "อธิบายคำถามหรือปัญหาให้ชัดเจน", submit: "ส่งคำขอ", sending: "กำลังส่ง…", sent: "ส่งคำขอถึงฝ่ายสนับสนุนแล้ว", error: "ส่งคำขอไม่สำเร็จ กรุณาลองใหม่", min: "กรุณากรอกรายละเอียดอย่างน้อย 10 ตัวอักษร", paidNotice: "คำขอยกเลิกคำสั่งซื้อที่ชำระแล้วจะถูกตรวจสอบโดยเจ้าหน้าที่ ไม่มีการยกเลิกหรือคืนเงินโดยอัตโนมัติ", history: "คำขอของคุณ", open: "เปิด", in_review: "กำลังตรวจสอบ", waiting_for_customer: "รอข้อมูลจากลูกค้า", resolved: "แก้ไขแล้ว", rejected: "ไม่อนุมัติ", close: "ปิด" },
  ro: { title: "Asistență pentru comandă", question: "Întrebare despre comandă", issue: "Raportează o problemă", cancellation: "Solicită anularea", subject: "Subiect", message: "Detalii", subjectHint: "Descrie pe scurt solicitarea", messageHint: "Explică întrebarea sau problema în detaliu", submit: "Trimite solicitarea", sending: "Se trimite…", sent: "Solicitarea a fost trimisă echipei de asistență", error: "Solicitarea nu a putut fi trimisă. Încearcă din nou.", min: "Introdu cel puțin 10 caractere în detalii.", paidNotice: "Solicitările de anulare pentru comenzile plătite sunt analizate de echipa noastră. Comanda nu va fi anulată sau rambursată automat.", history: "Solicitările tale", open: "Deschisă", in_review: "În analiză", waiting_for_customer: "Așteptăm răspunsul tău", resolved: "Rezolvată", rejected: "Respinsă", close: "Închide" },
} as const;

export function OrderSupport({ orderId, orderNumber, paymentStatus, orderStatus }: { orderId: string; orderNumber: string; paymentStatus: string; orderStatus: string }) {
  const { lang } = useT();
  const w = COPY[lang];
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<RequestType>("question");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const canCancel = orderStatus !== "completed" && orderStatus !== "cancelled";

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await (supabase as any).from("order_support_requests")
        .select("id,request_type,subject,status,created_at")
        .eq("user_id", auth.user.id).eq("order_id", orderId).order("created_at", { ascending: false });
      if (alive && data) setRequests(data as SupportRequest[]);
    })();
    return () => { alive = false; };
  }, [orderId]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setNotice("");
    if (subject.trim().length < 3 || message.trim().length < 10) { setError(w.min); return; }
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) { setError(w.error); return; }
    setBusy(true);
    const { data, error: insertError } = await (supabase as any).from("order_support_requests").insert({
      user_id: auth.user.id, order_id: orderId, request_type: kind, subject: subject.trim(), message: message.trim(),
    }).select("id,request_type,subject,status,created_at").single();
    setBusy(false);
    if (insertError || !data) { setError(w.error); return; }
    setRequests(current => [data as SupportRequest, ...current]);
    setSubject(""); setMessage(""); setKind("question"); setOpen(false); setNotice(w.sent);
  }

  return <section className="mt-4 border-t border-border/30 pt-4">
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="outline" onClick={() => { setOpen(v => !v); setError(""); setNotice(""); }}><MessageSquareText className="mr-2 h-4 w-4" />{w.title}</Button>
      <Button type="button" size="sm" variant="outline" onClick={() => { setOpen(true); setKind("question"); setSubject(""); setMessage(""); setError(""); setNotice(""); }}>{w.question}</Button>
      <Button type="button" size="sm" variant="outline" onClick={() => { setOpen(true); setKind("issue"); setSubject(""); setMessage(""); setError(""); setNotice(""); }}>{w.issue}</Button>
      {canCancel && <Button type="button" size="sm" variant="outline" onClick={() => { setOpen(true); setKind("cancellation"); setSubject(lang === "th" ? "ขอยกเลิกคำสั่งซื้อ" : lang === "ro" ? "Solicitare de anulare a comenzii" : "Order cancellation request"); setMessage(""); setError(""); setNotice(""); }}>{w.cancellation}</Button>}
    </div>
    {notice && <p role="status" className="mt-2 text-sm text-emerald-600">{notice}</p>}
    {open && <form onSubmit={submit} className="mt-4 grid gap-3 rounded-xl border border-primary/20 bg-primary/[0.03] p-4">
      <h3 className="font-semibold">{w.title} · {orderNumber}</h3>
      <div className="grid gap-2"><Label htmlFor={`support-kind-${orderId}`}>{w.title}</Label><select id={`support-kind-${orderId}`} value={kind} onChange={e => { const next = e.target.value as RequestType; setKind(next); if (next === "cancellation") setSubject(lang === "th" ? "ขอยกเลิกคำสั่งซื้อ" : lang === "ro" ? "Solicitare de anulare a comenzii" : "Order cancellation request"); }} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="question">{w.question}</option><option value="issue">{w.issue}</option>{canCancel && <option value="cancellation">{w.cancellation}</option>}</select></div>
      {kind === "cancellation" && paymentStatus === "paid" && <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">{w.paidNotice}</p>}
      <div className="grid gap-2"><Label htmlFor={`support-subject-${orderId}`}>{w.subject}</Label><Input id={`support-subject-${orderId}`} value={subject} onChange={e => setSubject(e.target.value)} minLength={3} maxLength={160} required placeholder={w.subjectHint} /></div>
      <div className="grid gap-2"><Label htmlFor={`support-message-${orderId}`}>{w.message}</Label><Textarea id={`support-message-${orderId}`} value={message} onChange={e => setMessage(e.target.value)} minLength={10} maxLength={4000} rows={4} required placeholder={w.messageHint} /></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2"><Button type="submit" disabled={busy}><Send className="mr-2 h-4 w-4" />{busy ? w.sending : w.submit}</Button><Button type="button" variant="ghost" onClick={() => setOpen(false)}>{w.close}</Button></div>
    </form>}
    {requests.length > 0 && <div className="mt-4 rounded-lg bg-muted/30 p-3"><p className="mb-2 text-sm font-semibold">{w.history}</p><ul className="space-y-2">{requests.map(request => <li key={request.id} className="flex flex-wrap items-start justify-between gap-2 border-t border-border/30 pt-2 text-sm"><span><span className="font-medium">{request.subject}</span><span className="block text-xs text-muted-foreground">{w[request.request_type] ?? request.request_type} · {new Date(request.created_at).toLocaleDateString(lang === "th" ? "th-TH" : lang === "ro" ? "ro-RO" : "en-US")}</span></span><Badge variant={request.status === "resolved" ? "default" : request.status === "rejected" ? "destructive" : "secondary"}>{w[request.status as keyof typeof w] ?? request.status}</Badge></li>)}</ul></div>}
  </section>;
}
