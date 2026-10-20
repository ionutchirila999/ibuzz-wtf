import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, lineLink } from "@/lib/shop";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Minus, Plus, Trash2, Copy, ShoppingBag, Download, Share2 } from "lucide-react";

type CartItem = { id: string; quantity: number };
type CartProduct = { id: string; title: string; title_th?: string | null; title_ro?: string | null; price: number; stock: number; status: string };
const KEY = "ibuzz-cart-v1";
const readCart = (): CartItem[] => { try { const v = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(v) ? v.filter((x) => typeof x.id === "string" && Number.isInteger(x.quantity) && x.quantity > 0) : []; } catch { return []; } };

const COPY = {
  th: {
    checkout: "ชำระเงิน", intro: "ตรวจสอบสินค้า ชำระผ่าน PromptPay แล้วส่งคำสั่งซื้อและสลิปผ่าน LINE",
    loading: "กำลังโหลดตะกร้า…", empty: "ตะกร้าของคุณว่างเปล่า", browse: "เลือกซื้อสินค้า",
    each: "ต่อชิ้น", stock: "มีในสต็อก", decrease: "ลดจำนวน", increase: "เพิ่มจำนวน", remove: "นำสินค้าออก",
    total: "ยอดที่ต้องชำระ", totalNote: "โหลดราคาและสต็อกล่าสุดจากฐานข้อมูลสินค้า โปรดยืนยันยอดก่อนชำระเงิน",
    pay: "1. ชำระเงินด้วย PromptPay", qr: "คิวอาร์โค้ด PromptPay", saveQr: "บันทึก QR ลงอุปกรณ์", shareQr: "แชร์ QR", qrShared: "พร้อมแชร์ QR", qrShareFallback: "คัดลอกลิงก์ QR แล้ว",
    scan: "เปิดแอปธนาคารไทย สแกนคิวอาร์โค้ดด้านบน แล้วกรอกยอดที่แสดงที่นี่: ", staticQr: "คิวอาร์โค้ดนี้เป็นแบบคงที่ คุณต้องกรอกจำนวนเงินเอง",
    warning: "อย่าชำระเงินหากคิวอาร์โค้ดหรือข้อมูลผู้รับในแอปธนาคารไม่ตรงกับที่คาดไว้",
    send: "2. ส่งคำสั่งซื้อทาง LINE", name: "ชื่อของคุณ", namePlaceholder: "ชื่อสำหรับคำสั่งซื้อ",
    contact: "เบอร์โทรศัพท์หรือ LINE", contactPlaceholder: "ช่องทางที่เราติดต่อคุณได้",
    instructions: "คัดลอกรายละเอียดคำสั่งซื้อ เปิด LINE ส่งให้ iBuzz.wtf และแนบสลิปการชำระเงินในแชต",
    copied: "คัดลอกรายการแล้ว", copy: "คัดลอกรายละเอียดคำสั่งซื้อ", openLine: "เปิด LINE เพื่อส่งคำสั่งซื้อ",
    lineNote: "การเปิด LINE จะไม่ส่งข้อความให้อัตโนมัติ โปรดวางรายละเอียดที่คัดลอกไว้และแนบสลิปด้วยตนเอง",
    pending: "สถานะการชำระเงินจะยังคงรอตรวจสอบจนกว่า iBuzz.wtf จะตรวจสอบยอดเงินจริง การส่งสลิปเพียงอย่างเดียวยังไม่ถือว่ายืนยันการชำระเงิน",
    orderIntro: "สวัสดี iBuzz.wtf! ฉันต้องการสั่งซื้อสินค้า", orderName: "ชื่อ", orderContact: "ช่องทางติดต่อ",
    orderTotal: "ยอดรวม", payment: "การชำระเงิน: PromptPay (รอตรวจสอบด้วยตนเอง) ฉันจะแนบสลิปในแชต LINE นี้ โปรดยืนยันสต็อกและการชำระเงินก่อนดำเนินการ",
  },
  en: {
    checkout: "Checkout", intro: "Review your items, pay with PromptPay, then send the order and payment slip through LINE.",
    loading: "Loading cart…", empty: "Your cart is empty", browse: "Browse Market",
    each: "each", stock: "in stock", decrease: "Decrease quantity", increase: "Increase quantity", remove: "Remove item",
    total: "Total due", totalNote: "Prices and available stock are reloaded from the product database. Confirm the total before paying.",
    pay: "1. Pay with PromptPay", qr: "PromptPay QR code", saveQr: "Save QR to device", shareQr: "Share QR", qrShared: "Ready to share QR", qrShareFallback: "QR link copied",
    scan: "Open your Thai banking app, scan the QR above, and enter the exact total shown here: ", staticQr: "The QR is static, so you must enter the amount yourself.",
    warning: "Do not pay if the QR or recipient details shown by your banking app do not match what you expect.",
    send: "2. Send order to LINE", name: "Your name", namePlaceholder: "Name for the order",
    contact: "Phone or LINE contact", contactPlaceholder: "How we can contact you",
    instructions: "Copy the order message, open LINE, send it to iBuzz.wtf, and attach your payment slip in that chat.",
    copied: "Order copied", copy: "Copy order details", openLine: "Open LINE to send order",
    lineNote: "Opening LINE does not send the message automatically. Paste the copied order details and attach your slip yourself.",
    pending: "Payment status remains pending until iBuzz.wtf manually checks the funds. Sending a slip alone does not confirm payment.",
    orderIntro: "Hello iBuzz.wtf! I'd like to place an order.", orderName: "Name", orderContact: "Contact",
    orderTotal: "TOTAL", payment: "Payment: PromptPay (pending manual verification). I will attach my payment slip in this LINE chat. Please confirm stock and payment before processing.",
  },
  ro: {
    checkout: "Finalizarea comenzii", intro: "Verifică produsele, plătește prin PromptPay, apoi trimite comanda și dovada plății prin LINE.",
    loading: "Se încarcă coșul…", empty: "Coșul tău este gol", browse: "Vezi produsele",
    each: "bucata", stock: "în stoc", decrease: "Scade cantitatea", increase: "Mărește cantitatea", remove: "Elimină produsul",
    total: "Total de plată", totalNote: "Prețurile și stocul disponibil sunt reîncărcate din baza de date. Confirmă totalul înainte de plată.",
    pay: "1. Plătește cu PromptPay", qr: "Cod QR PromptPay", saveQr: "Salvează QR pe dispozitiv", shareQr: "Distribuie QR", qrShared: "QR pregătit pentru partajare", qrShareFallback: "Linkul QR a fost copiat",
    scan: "Deschide aplicația bancară thailandeză, scanează codul QR și introdu suma exactă afișată aici: ", staticQr: "Codul QR este static, deci trebuie să introduci suma manual.",
    warning: "Nu plăti dacă detaliile codului QR sau ale destinatarului din aplicația bancară nu corespund.",
    send: "2. Trimite comanda prin LINE", name: "Numele tău", namePlaceholder: "Numele pentru comandă",
    contact: "Telefon sau contact LINE", contactPlaceholder: "Cum te putem contacta",
    instructions: "Copiază comanda, deschide LINE, trimite-o către iBuzz.wtf și atașează dovada plății în chat.",
    copied: "Comanda a fost copiată", copy: "Copiază detaliile comenzii", openLine: "Deschide LINE pentru a trimite comanda",
    lineNote: "Deschiderea LINE nu trimite automat mesajul. Lipește detaliile copiate și atașează manual dovada plății.",
    pending: "Plata rămâne în așteptare până când iBuzz.wtf verifică încasarea. Trimiterea dovezii nu confirmă singură plata.",
    orderIntro: "Salut iBuzz.wtf! Aș dori să plasez o comandă.", orderName: "Nume", orderContact: "Contact",
    orderTotal: "TOTAL", payment: "Plată: PromptPay (în așteptarea verificării manuale). Voi atașa dovada plății în acest chat LINE. Vă rog să confirmați stocul și plata înainte de procesare.",
  },
} as const;

export const Route = createFileRoute("/checkout")({ component: Checkout });

function Checkout() {
  const { lang } = useT();
  const c = COPY[lang];
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrMessage, setQrMessage] = useState("");

  useEffect(() => {
    const items = readCart();
    setCart(items);
    if (!items.length) { setLoading(false); return; }
    void supabase.from("products").select("id,title,title_th,title_ro,price,stock,status").in("id", items.map(x => x.id))
      .then(({ data, error }) => { if (!error && data) setProducts(data as CartProduct[]); setLoading(false); });
  }, []);

  const items = useMemo(() => cart.flatMap(item => {
    const p = products.find(x => x.id === item.id);
    return p && p.status !== "sold" && p.status !== "hidden" && p.stock > 0
      ? [{ ...p, displayTitle: (lang === "th" ? p.title_th : lang === "ro" ? p.title_ro : null) || p.title, quantity: Math.min(item.quantity, p.stock) }]
      : [];
  }), [cart, products, lang]);
  const total = items.reduce((sum, p) => sum + Number(p.price) * p.quantity, 0);

  const orderText = () => `${c.orderIntro}\n${c.orderName}: ${name.trim()}\n${c.orderContact}: ${contact.trim()}\n\n${items.map(p => `${p.displayTitle} × ${p.quantity} = ฿${(Number(p.price) * p.quantity).toLocaleString("en-US", { maximumFractionDigits: 2 })}`).join("\n")}\n\n${c.orderTotal}: ฿${total.toLocaleString("en-US", { maximumFractionDigits: 2 })}\n${c.payment}`;
  const updateQty = (id: string, qty: number) => {
    const next = cart.map(x => x.id === id ? { ...x, quantity: qty } : x).filter(x => x.quantity > 0);
    setCart(next); localStorage.setItem(KEY, JSON.stringify(next));
  };
  const copyOrder = async () => { try { await navigator.clipboard.writeText(orderText()); setCopied(true); } catch { setCopied(false); } };
  const shareQr = async () => {
    const url = new URL("/promptpay-qr.jpg", window.location.origin).href;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("QR image unavailable");
      const blob = await response.blob();
      const file = new File([blob], "iBuzz-PromptPay-QR.jpg", { type: blob.type || "image/jpeg" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: c.qr, files: [file] });
        setQrMessage(c.qrShared);
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: c.qr, text: c.qr, url });
        setQrMessage(c.qrShared);
        return;
      }
      await navigator.clipboard.writeText(url);
      setQrMessage(c.qrShareFallback);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        setQrMessage(c.qrShareFallback);
      } catch {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    }
  };
  const openLine = () => { void copyOrder(); window.open(lineLink(), "_blank", "noopener,noreferrer"); };

  return <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
    <div><p className="text-sm text-muted-foreground">iBuzz.wtf · Market</p><h1 className="mt-1 text-3xl font-bold">{c.checkout}</h1><p className="mt-2 text-sm text-muted-foreground">{c.intro}</p></div>
    {loading ? <p>{c.loading}</p> : !items.length ? <div className="rounded-xl border p-6 text-center"><ShoppingBag className="mx-auto mb-3 h-8 w-8"/><p className="font-semibold">{c.empty}</p><Button asChild className="mt-4"><Link to="/shop" search={{ lang }}>{c.browse}</Link></Button></div> : <>
      <section className="space-y-3">{items.map(p => <div key={p.id} className="flex items-center gap-3 rounded-xl border p-4"><div className="min-w-0 flex-1"><p className="font-medium">{p.displayTitle}</p><p className="text-sm text-muted-foreground">{formatPrice(p.price)} {c.each} · {p.stock} {c.stock}</p></div><div className="flex items-center gap-2"><Button size="icon" variant="outline" aria-label={c.decrease} onClick={() => updateQty(p.id, p.quantity - 1)}><Minus className="h-4 w-4"/></Button><span className="w-5 text-center">{p.quantity}</span><Button size="icon" variant="outline" aria-label={c.increase} disabled={p.quantity >= p.stock} onClick={() => updateQty(p.id, p.quantity + 1)}><Plus className="h-4 w-4"/></Button><Button size="icon" variant="ghost" aria-label={c.remove} onClick={() => updateQty(p.id, 0)}><Trash2 className="h-4 w-4"/></Button></div><strong className="w-24 text-right">{formatPrice(Number(p.price) * p.quantity)}</strong></div>)}</section>
      <section className="rounded-xl border p-5"><div className="flex items-center justify-between text-lg font-bold"><span>{c.total}</span><span>{formatPrice(total)} THB</span></div><p className="mt-2 text-sm text-muted-foreground">{c.totalNote}</p></section>
      <section className="space-y-4 rounded-xl border p-5"><h2 className="text-xl font-semibold">{c.pay}</h2><a href="/promptpay-qr.jpg" target="_blank" rel="noreferrer" aria-label={c.qr} className="relative mx-auto block aspect-square w-full max-w-sm overflow-hidden rounded-lg border bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><img src="/promptpay-qr.jpg" alt={c.qr} className="absolute left-[-50%] top-[-134%] w-[200%] max-w-none"/></a><div className="mx-auto grid w-full max-w-sm grid-cols-2 gap-2"><Button asChild variant="outline" className="w-full"><a href="/promptpay-qr.jpg" download="iBuzz-PromptPay-QR.jpg"><Download className="mr-2 h-4 w-4"/>{c.saveQr}</a></Button><Button type="button" variant="outline" className="w-full" onClick={() => void shareQr()}><Share2 className="mr-2 h-4 w-4"/>{c.shareQr}</Button></div>{qrMessage && <p role="status" className="text-center text-xs text-muted-foreground">{qrMessage}</p>}<p className="text-sm">{c.scan}<strong>{formatPrice(total)}</strong>. {c.staticQr}</p><p className="text-sm text-amber-700 dark:text-amber-300">{c.warning}</p></section>
      <section className="space-y-4 rounded-xl border p-5"><h2 className="text-xl font-semibold">{c.send}</h2><div className="space-y-2"><Label htmlFor="buyer-name">{c.name}</Label><Input id="buyer-name" value={name} onChange={e => setName(e.target.value)} placeholder={c.namePlaceholder} required/></div><div className="space-y-2"><Label htmlFor="buyer-contact">{c.contact}</Label><Input id="buyer-contact" value={contact} onChange={e => setContact(e.target.value)} placeholder={c.contactPlaceholder} required/></div><p className="text-sm text-muted-foreground">{c.instructions}</p><div className="grid gap-2 sm:grid-cols-2"><Button variant="outline" disabled={!name.trim() || !contact.trim()} onClick={() => void copyOrder()}><Copy className="mr-2 h-4 w-4"/>{copied ? c.copied : c.copy}</Button><Button disabled={!name.trim() || !contact.trim()} onClick={openLine}>{c.openLine}</Button></div><p className="text-xs text-muted-foreground">{c.lineNote}</p></section>
    </>}
    <p className="text-xs text-muted-foreground">{c.pending}</p>
  </main>;
}
