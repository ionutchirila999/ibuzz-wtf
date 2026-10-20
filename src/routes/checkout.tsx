import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, lineLink } from "@/lib/shop";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
    checkout: "Finalizarea comenzii", intro: "Verifică produsele din coș, plătește prin PromptPay, apoi trimite comanda și dovada plății prin LINE.",
    loading: "Se încarcă coșul…", empty: "Coșul tău este gol", browse: "Vezi produsele",
    each: "pe bucată", stock: "în stoc", decrease: "Scade cantitatea", increase: "Mărește cantitatea", remove: "Elimină produsul",
    total: "Total de plată", totalNote: "Prețurile și stocul sunt actualizate din baza de date. Verifică suma înainte de a plăti.",
    pay: "1. Plătește prin PromptPay", qr: "Cod QR PromptPay", saveQr: "Salvează codul QR", shareQr: "Partajează codul QR", qrShared: "Cod QR pregătit pentru partajare", qrShareFallback: "Linkul codului QR a fost copiat",
    scan: "Deschide aplicația băncii din Thailanda, scanează codul QR și introdu suma exactă afișată aici: ", staticQr: "Codul QR este static; introdu manual suma de plată.",
    warning: "Nu efectua plata dacă informațiile despre codul QR sau beneficiar din aplicația bancară nu corespund.",
    send: "2. Trimite comanda prin LINE", name: "Numele tău", namePlaceholder: "Numele pentru comandă",
    contact: "Telefon sau ID LINE", contactPlaceholder: "Datele la care te putem contacta",
    instructions: "Copiază detaliile comenzii, deschide LINE, trimite-le către iBuzz.wtf și atașează dovada plății în conversație.",
    copied: "Detaliile comenzii au fost copiate", copy: "Copiază detaliile comenzii", openLine: "Deschide LINE pentru a trimite comanda",
    lineNote: "Deschiderea LINE nu trimite automat mesajul. Lipește detaliile copiate și atașează dovada plății.",
    pending: "Plata rămâne în așteptare până când iBuzz.wtf confirmă încasarea. Trimiterea dovezii de plată nu înseamnă că plata a fost confirmată.",
    orderIntro: "Salut, iBuzz.wtf! Aș dori să plasez o comandă.", orderName: "Nume", orderContact: "Date de contact",
    orderTotal: "TOTAL", payment: "Plată prin PromptPay (în curs de verificare manuală). Voi atașa dovada plății în această conversație LINE. Vă rog să confirmați stocul și plata înainte de procesarea comenzii.",
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
  const [qrOpen, setQrOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

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
  const makeQrPng = async () => {
    const response = await fetch("/promptpay-qr.svg");
    if (!response.ok) throw new Error("QR image unavailable");
    const svgBlob = await response.blob();
    const objectUrl = URL.createObjectURL(svgBlob);
    try {
      const image = new Image();
      image.src = objectUrl;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("QR image could not be rendered"));
      });
      const canvas = document.createElement("canvas");
      canvas.width = 884;
      canvas.height = 884;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const png = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("PNG export failed")), "image/png");
      });
      return new File([png], "iBuzz-PromptPay-QR.png", { type: "image/png" });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };
  const downloadQr = async () => {
    try {
      const file = await makeQrPng();
      const url = URL.createObjectURL(file);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setQrMessage(c.qrShareFallback);
    }
  };
  const copyQrImage = async () => {
    try {
      const file = await makeQrPng();
      if (navigator.clipboard && typeof ClipboardItem !== "undefined" && typeof navigator.clipboard.write === "function") {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": file })]);
        setQrMessage(lang === "th" ? "คัดลอกรูป QR แล้ว" : lang === "ro" ? "Imaginea QR a fost copiată" : "QR image copied");
        setShareOpen(false);
        return;
      }
      await downloadQr();
      setShareOpen(false);
    } catch {
      await downloadQr();
      setShareOpen(false);
    }
  };
  const openSocialShare = async (platform: "facebook" | "whatsapp" | "line" | "telegram" | "x") => {
    const caption = c.qr;
    const targets: Record<typeof platform, string> = {
      facebook: "https://www.facebook.com/",
      whatsapp: "https://web.whatsapp.com/",
      line: "https://line.me/",
      telegram: "https://web.telegram.org/",
      x: "https://x.com/compose/post?text=" + encodeURIComponent(caption),
    };
    // Download the PNG; public social share URLs cannot attach an image file automatically.
    await downloadQr();
    window.open(targets[platform], "_blank", "noopener,noreferrer");
    setShareOpen(false);
  };
  const shareQr = async () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) {
      setShareOpen(true);
      return;
    }
    try {
      const file = await makeQrPng();
      if (typeof navigator.share === "function" && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: c.qr, files: [file] });
        setQrMessage(c.qrShared);
        return;
      }
      setShareOpen(true);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareOpen(true);
    }
  };
  const openLine = () => { void copyOrder(); window.open(lineLink(), "_blank", "noopener,noreferrer"); };

  return <main className="mx-auto w-full max-w-3xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 sm:py-8">
    <div className="space-y-1"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">iBuzz.wtf · Market</p><h1 className="text-2xl font-bold sm:text-3xl">{c.checkout}</h1><p className="text-sm leading-relaxed text-muted-foreground">{c.intro}</p></div>
    {loading ? <p>{c.loading}</p> : !items.length ? <div className="rounded-xl border p-6 text-center"><ShoppingBag className="mx-auto mb-3 h-8 w-8"/><p className="font-semibold">{c.empty}</p><Button asChild className="mt-4"><Link to="/shop" search={{ lang }}>{c.browse}</Link></Button></div> : <>
      <section className="space-y-3">{items.map(p => <div key={p.id} className="space-y-3 rounded-xl border border-border/70 p-3 sm:flex sm:items-center sm:gap-3 sm:space-y-0 sm:p-4"><div className="min-w-0 sm:flex-1"><p className="break-words font-medium leading-snug">{p.displayTitle}</p><p className="mt-1 text-sm text-muted-foreground">{formatPrice(p.price)} {c.each} · {p.stock} {c.stock}</p></div><div className="flex items-center justify-between gap-3 sm:justify-end"><div className="flex items-center gap-2"><Button size="icon" variant="outline" aria-label={c.decrease} onClick={() => updateQty(p.id, p.quantity - 1)}><Minus className="h-4 w-4"/></Button><span className="w-5 text-center tabular-nums">{p.quantity}</span><Button size="icon" variant="outline" aria-label={c.increase} disabled={p.quantity >= p.stock} onClick={() => updateQty(p.id, p.quantity + 1)}><Plus className="h-4 w-4"/></Button><Button size="icon" variant="ghost" aria-label={c.remove} onClick={() => updateQty(p.id, 0)}><Trash2 className="h-4 w-4"/></Button></div><strong className="shrink-0 text-right">{formatPrice(Number(p.price) * p.quantity)}</strong></div></div>)}</section>
      <section className="rounded-xl border border-border/70 p-4 sm:p-5"><div className="flex items-start justify-between gap-3 text-base font-bold sm:text-lg"><span>{c.total}</span><span className="shrink-0 text-right tabular-nums">{formatPrice(total)} THB</span></div><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.totalNote}</p></section>
      <section className="space-y-4 rounded-xl border border-border/70 p-3 sm:p-5"><h2 className="text-lg font-semibold sm:text-xl">{c.pay}</h2><button type="button" onClick={() => setQrOpen(true)} aria-label={c.qr} className="relative mx-auto block aspect-square w-full max-w-[240px] overflow-hidden rounded-xl border bg-white p-2 transition hover:ring-2 hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-[300px] sm:p-3"><img src="/promptpay-qr.svg" alt={c.qr} className="h-full w-full object-contain select-none" draggable={false}/></button><Dialog open={qrOpen} onOpenChange={setQrOpen}><DialogContent className="w-[calc(100vw-2rem)] max-w-sm rounded-xl p-4 sm:p-6"><DialogTitle>{c.qr}</DialogTitle><div className="relative mx-auto aspect-square w-full max-w-[min(72vw,320px)] overflow-hidden rounded-lg border bg-white"><img src="/promptpay-qr.svg" alt={c.qr} className="h-full w-full object-contain select-none" draggable={false}/></div><Button type="button" className="w-full" onClick={() => setQrOpen(false)}>{lang === "th" ? "กลับไปชำระเงิน" : lang === "ro" ? "Înapoi la plată" : "Back to checkout"}</Button></DialogContent></Dialog><Dialog open={shareOpen} onOpenChange={setShareOpen}><DialogContent className="w-[calc(100vw-2rem)] max-w-sm rounded-xl p-5"><DialogTitle>{lang === "th" ? "แชร์รูป QR PromptPay" : lang === "ro" ? "Partajează imaginea QR PromptPay" : "Share PromptPay QR image"}</DialogTitle><p className="text-sm text-muted-foreground">{lang === "th" ? "เลือกโซเชียลมีเดีย ระบบจะดาวน์โหลดรูป PNG แล้วเปิดแอปให้คุณแนบรูปนั้นในโพสต์หรือแชต" : lang === "ro" ? "Alege o rețea socială. Imaginea PNG va fi descărcată, apoi se va deschide aplicația pentru a o atașa manual." : "Choose a social network. The PNG will download, then the site opens so you can attach the image to your post or chat."}</p><div className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" className="min-h-11" onClick={() => void openSocialShare("facebook")}>Facebook</Button><Button type="button" variant="outline" className="min-h-11" onClick={() => void openSocialShare("whatsapp")}>WhatsApp</Button><Button type="button" variant="outline" className="min-h-11" onClick={() => void openSocialShare("line")}>LINE</Button><Button type="button" variant="outline" className="min-h-11" onClick={() => void openSocialShare("telegram")}>Telegram</Button><Button type="button" variant="outline" className="min-h-11" onClick={() => void openSocialShare("x")}>X</Button><Button type="button" variant="outline" className="min-h-11" onClick={() => void copyQrImage()}><Copy className="mr-2 h-4 w-4"/>{lang === "th" ? "คัดลอกรูปภาพ" : lang === "ro" ? "Copiază imaginea" : "Copy image"}</Button><Button type="button" className="col-span-2 min-h-11" onClick={() => { setShareOpen(false); void downloadQr(); }}><Download className="mr-2 h-4 w-4"/>{lang === "th" ? "ดาวน์โหลดรูป PNG" : lang === "ro" ? "Descarcă imaginea PNG" : "Download PNG image"}</Button></div></DialogContent></Dialog><div className="mx-auto grid w-full max-w-[280px] grid-cols-2 gap-2 sm:max-w-sm"><Button type="button" variant="outline" className="h-auto min-h-11 w-full whitespace-normal px-2 py-2 text-xs sm:text-sm" onClick={() => void downloadQr()}><Download className="mr-1.5 h-4 w-4 shrink-0"/>{c.saveQr}</Button><Button type="button" variant="outline" className="h-auto min-h-11 w-full whitespace-normal px-2 py-2 text-xs sm:text-sm" onClick={() => void shareQr()}><Share2 className="mr-1.5 h-4 w-4 shrink-0"/>{c.shareQr}</Button></div>{qrMessage && <p role="status" className="text-center text-xs text-muted-foreground">{qrMessage}</p>}<p className="text-sm leading-relaxed">{c.scan}<strong>{formatPrice(total)}</strong>. {c.staticQr}</p><p className="rounded-lg bg-amber-500/10 p-3 text-sm leading-relaxed text-amber-700 dark:text-amber-300">{c.warning}</p></section>
      <section className="space-y-4 rounded-xl border border-border/70 p-3 sm:p-5"><h2 className="text-lg font-semibold sm:text-xl">{c.send}</h2><div className="space-y-2"><Label htmlFor="buyer-name">{c.name}</Label><Input id="buyer-name" value={name} onChange={e => setName(e.target.value)} placeholder={c.namePlaceholder} required/></div><div className="space-y-2"><Label htmlFor="buyer-contact">{c.contact}</Label><Input id="buyer-contact" value={contact} onChange={e => setContact(e.target.value)} placeholder={c.contactPlaceholder} required/></div><p className="text-sm text-muted-foreground">{c.instructions}</p><div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><Button className="min-h-11 whitespace-normal" variant="outline" disabled={!name.trim() || !contact.trim()} onClick={() => void copyOrder()}><Copy className="mr-2 h-4 w-4 shrink-0"/>{copied ? c.copied : c.copy}</Button><Button className="min-h-11 whitespace-normal" disabled={!name.trim() || !contact.trim()} onClick={openLine}>{c.openLine}</Button></div><p className="text-xs text-muted-foreground">{c.lineNote}</p></section>
    </>}
    <p className="text-xs text-muted-foreground">{c.pending}</p>
  </main>;
}
