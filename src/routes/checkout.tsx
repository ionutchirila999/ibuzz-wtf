import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, lineLink } from "@/lib/shop";
import { useT } from "@/lib/i18n";
import { pageHead } from "@/lib/service-copy";
import { checkoutTotal, reconcileCheckoutItems } from "@/lib/checkout";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Minus, Plus, Trash2, Copy, ShoppingBag, Download, Share2 } from "lucide-react";

type CartItem = { id: string; quantity: number };
type CartProduct = { id: string; title: string; title_th?: string | null; title_ro?: string | null; price: number; stock: number; status: string };
const KEY = "ibuzz-cart-v1";
const readCart = (): CartItem[] => { try { const v = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(v) ? v.filter((x) => typeof x.id === "string" && Number.isInteger(x.quantity) && x.quantity > 0) : []; } catch { return []; } };

const COPY = {
  th: {
    checkout: "ชำระเงิน", intro: "ตรวจสอบสินค้า ชำระผ่าน PromptPay แล้วส่งคำสั่งซื้อและสลิปผ่าน LINE", accountNotice: "ก่อนสั่งซื้อ โปรดเข้าสู่ระบบหรือสร้างบัญชีเพื่อบันทึกและติดตามคำสั่งซื้อ ตะกร้าสินค้าของคุณจะยังคงอยู่บนอุปกรณ์นี้", accountAction: "เข้าสู่ระบบ / สร้างบัญชี",
    loading: "กำลังโหลดตะกร้า…", empty: "ตะกร้าของคุณว่างเปล่า", browse: "เลือกซื้อสินค้า",
    each: "ต่อชิ้น", stock: "มีในสต็อก", decrease: "ลดจำนวน", increase: "เพิ่มจำนวน", remove: "นำสินค้าออก",
    total: "ยอดที่ต้องชำระ", totalNote: "โหลดราคาและสต็อกล่าสุดจากฐานข้อมูลสินค้า โปรดยืนยันยอดก่อนชำระเงิน", discountCode:"รหัสส่วนลด", applyDiscount:"ใช้รหัส", discountSaved:"ส่วนลด", subtotal:"ยอดก่อนหักส่วนลด",
    pay: "1. ชำระเงินด้วย PromptPay", qr: "คิวอาร์โค้ด PromptPay", saveQr: "บันทึก QR ลงอุปกรณ์", shareQr: "แชร์ QR", qrShared: "พร้อมแชร์ QR", qrShareFallback: "คัดลอกลิงก์ QR แล้ว",
    scan: "เปิดแอปธนาคารไทย สแกนคิวอาร์โค้ดด้านบน แล้วกรอกยอดที่แสดงที่นี่: ", staticQr: "คิวอาร์โค้ดนี้เป็นแบบคงที่ คุณต้องกรอกจำนวนเงินเอง",
    warning: "อย่าชำระเงินหากคิวอาร์โค้ดหรือข้อมูลผู้รับในแอปธนาคารไม่ตรงกับที่คาดไว้",
    send: "2. ส่งคำสั่งซื้อทาง LINE", name: "ชื่อของคุณ", namePlaceholder: "ชื่อสำหรับคำสั่งซื้อ",
    contact: "เบอร์โทรศัพท์หรือ LINE", contactPlaceholder: "ช่องทางที่เราติดต่อคุณได้", shippingAddress: "ที่อยู่จัดส่ง", shippingAddressPlaceholder: "บ้านเลขที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์",
    instructions: "คัดลอกรายละเอียดคำสั่งซื้อ เปิด LINE ส่งให้ iBuzz.wtf และแนบสลิปการชำระเงินในแชต",
    copied: "คัดลอกรายการแล้ว", copy: "คัดลอกรายละเอียดคำสั่งซื้อ", openLine: "เปิด LINE เพื่อส่งคำสั่งซื้อ",
    lineNote: "การเปิด LINE จะไม่ส่งข้อความให้อัตโนมัติ โปรดวางรายละเอียดที่คัดลอกไว้และแนบสลิปด้วยตนเอง",
    pending: "สถานะการชำระเงินจะยังคงรอตรวจสอบจนกว่า iBuzz.wtf จะตรวจสอบยอดเงินจริง การส่งสลิปเพียงอย่างเดียวยังไม่ถือว่ายืนยันการชำระเงิน",
    orderIntro: "สวัสดี iBuzz.wtf! ฉันต้องการสั่งซื้อสินค้า", orderName: "ชื่อ", orderContact: "ช่องทางติดต่อ",
    orderTotal: "ยอดรวม", payment: "การชำระเงิน: PromptPay (รอตรวจสอบด้วยตนเอง) ฉันจะแนบสลิปในแชต LINE นี้ โปรดยืนยันสต็อกและการชำระเงินก่อนดำเนินการ",
  },
  en: {
    checkout: "Checkout", intro: "Review your items, pay with PromptPay, then send the order and payment slip through LINE.", accountNotice: "Before placing your order, sign in or create an account so your order can be saved and tracked. Your cart will remain on this device.", accountAction: "Sign in / Create account",
    loading: "Loading cart…", empty: "Your cart is empty", browse: "Browse Market",
    each: "each", stock: "in stock", decrease: "Decrease quantity", increase: "Increase quantity", remove: "Remove item",
    total: "Total due", totalNote: "Prices and available stock are reloaded from the product database. Confirm the total before paying.", discountCode:"Discount code", applyDiscount:"Apply code", discountSaved:"Discount", subtotal:"Subtotal",
    pay: "1. Pay with PromptPay", qr: "PromptPay QR code", saveQr: "Save QR to device", shareQr: "Share QR", qrShared: "Ready to share QR", qrShareFallback: "QR link copied",
    scan: "Open your Thai banking app, scan the QR above, and enter the exact total shown here: ", staticQr: "The QR is static, so you must enter the amount yourself.",
    warning: "Do not pay if the QR or recipient details shown by your banking app do not match what you expect.",
    send: "2. Send order to LINE", name: "Your name", namePlaceholder: "Name for the order",
    contact: "Phone or LINE contact", contactPlaceholder: "How we can contact you", shippingAddress: "Delivery address", shippingAddressPlaceholder: "House number, street, district, province, postal code",
    instructions: "Copy the order message, open LINE, send it to iBuzz.wtf, and attach your payment slip in that chat.",
    copied: "Order copied", copy: "Copy order details", openLine: "Open LINE to send order",
    lineNote: "Opening LINE does not send the message automatically. Paste the copied order details and attach your slip yourself.",
    pending: "Payment status remains pending until iBuzz.wtf manually checks the funds. Sending a slip alone does not confirm payment.",
    orderIntro: "Hello iBuzz.wtf! I'd like to place an order.", orderName: "Name", orderContact: "Contact",
    orderTotal: "TOTAL", payment: "Payment: PromptPay (pending manual verification). I will attach my payment slip in this LINE chat. Please confirm stock and payment before processing.",
  },
  ro: {
    checkout: "Finalizarea comenzii", intro: "Verifică produsele din coș, plătește prin PromptPay, apoi trimite comanda și dovada plății prin LINE.", accountNotice: "Înainte de a plasa comanda, autentifică-te sau creează un cont pentru ca aceasta să fie salvată și urmărită. Coșul va rămâne pe acest dispozitiv.", accountAction: "Autentificare / Creează cont",
    loading: "Se încarcă coșul…", empty: "Coșul tău este gol", browse: "Vezi produsele",
    each: "pe bucată", stock: "în stoc", decrease: "Scade cantitatea", increase: "Mărește cantitatea", remove: "Elimină produsul",
    total: "Total de plată", totalNote: "Prețurile și stocul sunt actualizate din baza de date. Verifică suma înainte de a plăti.", discountCode:"Cod de reducere", applyDiscount:"Aplică", discountSaved:"Reducere", subtotal:"Subtotal",
    pay: "1. Plătește prin PromptPay", qr: "Cod QR PromptPay", saveQr: "Salvează codul QR", shareQr: "Partajează codul QR", qrShared: "Cod QR pregătit pentru partajare", qrShareFallback: "Linkul codului QR a fost copiat",
    scan: "Deschide aplicația băncii din Thailanda, scanează codul QR și introdu suma exactă afișată aici: ", staticQr: "Codul QR este static; introdu manual suma de plată.",
    warning: "Nu efectua plata dacă informațiile despre codul QR sau beneficiar din aplicația bancară nu corespund.",
    send: "2. Trimite comanda prin LINE", name: "Numele tău", namePlaceholder: "Numele pentru comandă",
    contact: "Telefon sau ID LINE", contactPlaceholder: "Datele la care te putem contacta", shippingAddress: "Adresa de livrare", shippingAddressPlaceholder: "Stradă, district, provincie, cod poștal",
    instructions: "Copiază detaliile comenzii, deschide LINE, trimite-le către iBuzz.wtf și atașează dovada plății în conversație.",
    copied: "Detaliile comenzii au fost copiate", copy: "Copiază detaliile comenzii", openLine: "Deschide LINE pentru a trimite comanda",
    lineNote: "Deschiderea LINE nu trimite automat mesajul. Lipește detaliile copiate și atașează dovada plății.",
    pending: "Plata rămâne în așteptare până când iBuzz.wtf confirmă încasarea. Trimiterea dovezii de plată nu înseamnă că plata a fost confirmată.",
    orderIntro: "Salut, iBuzz.wtf! Aș dori să plasez o comandă.", orderName: "Nume", orderContact: "Date de contact",
    orderTotal: "TOTAL", payment: "Plată prin PromptPay (în curs de verificare manuală). Voi atașa dovada plății în această conversație LINE. Vă rog să confirmați stocul și plata înainte de procesarea comenzii.",
  },
} as const;

export const Route = createFileRoute("/checkout")({
  staticData: { sitemap: "exclude-subtree" },
  head: () => pageHead("Checkout", "Review your iBuzz.wtf Market order and pay with PromptPay before sending your payment slip through LINE."),
  component: Checkout,
});

function Checkout() {
  const { lang } = useT();
  const c = COPY[lang];
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrMessage, setQrMessage] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);
  const [savedOrderText, setSavedOrderText] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{code:string;amount:number;subtotal:number}|null>(null);
  const checkoutStarted = useRef(false);
  const cartHydrated = useRef(false);

  useEffect(() => {
    if (cartHydrated.current) return;
    cartHydrated.current = true;
    const localItems = readCart();
    setCart(localItems);
    void (async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      let items = localItems;

      if (user) {
        const { data: savedProfile } = await (supabase as any)
          .from("customer_profiles")
          .select("full_name,phone,delivery_addresses")
          .eq("user_id", user.id)
          .maybeSingle();
        const metadata = user.user_metadata ?? {};
        const profile = savedProfile ?? metadata;
        setName(current => current || (typeof profile.full_name === "string" ? profile.full_name : ""));
        setContact(current => current || (typeof profile.phone === "string" ? profile.phone : ""));
        const addresses = Array.isArray(profile.delivery_addresses) ? profile.delivery_addresses : [];
        const defaultAddress = addresses.find((item: any) => item && typeof item.address === "string" && item.is_default === true);
        const fallbackAddress = typeof metadata.delivery_address === "string" ? metadata.delivery_address : "";
        setShippingAddress(current => current || (typeof defaultAddress?.address === "string" ? defaultAddress.address : fallbackAddress));

        const { data: savedCart } = await (supabase as any)
          .from("customer_carts")
          .select("items")
          .eq("user_id", user.id)
          .maybeSingle();
        const remoteItems = Array.isArray(savedCart?.items)
          ? savedCart.items.filter((item: any) => item && typeof item.id === "string" && Number.isInteger(item.quantity) && item.quantity > 0) as CartItem[]
          : [];
        if (remoteItems.length) {
          const merged = new Map<string, number>();
          for (const item of remoteItems) merged.set(item.id, item.quantity);
          for (const item of localItems) merged.set(item.id, Math.max(merged.get(item.id) ?? 0, item.quantity));
          items = Array.from(merged, ([id, quantity]) => ({ id, quantity }));
          try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* In-memory cart remains available. */ }
          setCart(items);
          toast.success(lang === "th" ? "กู้คืนตะกร้าสินค้าของคุณแล้ว" : lang === "ro" ? "Coșul salvat a fost recuperat" : "Your saved cart has been restored");
          trackEvent("cart_restored", { item_count: items.length, quantity: items.reduce((sum, item) => sum + item.quantity, 0) });
        }
      }

      setIsSignedIn(!!user);
      if (!items.length) { setLoading(false); return; }
      const { data, error } = await supabase.from("products")
        .select("id,title,title_th,title_ro,price,stock,status")
        .in("id", items.map(item => item.id));
      if (!error && data) setProducts(data as CartProduct[]);
      setLoading(false);
    })().catch(() => { setIsSignedIn(false); setLoading(false); });
  }, [lang]);
  useEffect(() => {
    if (isSignedIn !== true) return;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      await (supabase as any).from("customer_carts").upsert({
        user_id: data.user.id,
        items: cart,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    })();
  }, [cart, isSignedIn]);

  const items = useMemo(() => reconcileCheckoutItems(cart, products).map(p => ({
    ...p,
    displayTitle: (lang === "th" ? (p as CartProduct).title_th : lang === "ro" ? (p as CartProduct).title_ro : null) || p.title,
  })), [cart, products, lang]);
  const total = checkoutTotal(items);
  const appliedDiscountAmount = appliedDiscount && appliedDiscount.subtotal === total ? appliedDiscount.amount : 0;
  const payableTotal = Math.max(0,total-appliedDiscountAmount);

  useEffect(() => {
    if (loading || !items.length || checkoutStarted.current) return;
    checkoutStarted.current = true;
    trackEvent("begin_checkout", {
      value: payableTotal,
      currency: "THB",
      item_count: items.length,
      quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    });
  }, [items, loading, payableTotal]);

  const applyDiscount = async () => { const code=discountCode.trim().toUpperCase(); if(!code){toast.error(lang==="th"?"กรอกรหัสส่วนลดก่อน":lang==="ro"?"Introdu un cod de reducere":"Enter a discount code first");return;} const {data,error} = await (supabase as any).rpc("validate_discount_code",{p_code:code,p_subtotal:total}); if(error||!data?.valid){setAppliedDiscount(null);toast.error(data?.message||(lang==="th"?"รหัสส่วนลดไม่ถูกต้อง":lang==="ro"?"Codul nu este valid":"Discount code is not valid"));return;} setDiscountCode(code);setAppliedDiscount({code,amount:Number(data.discount_amount)||0,subtotal:total});toast.success(lang==="th"?"ใช้รหัสส่วนลดแล้ว":lang==="ro"?"Cod aplicat":"Discount applied"); };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) {
      const removedItem = items.find(item => item.id === id);
      trackEvent("remove_from_cart", {
        item_id: id,
        item_name: removedItem?.displayTitle,
        price: removedItem ? Number(removedItem.price) : undefined,
        quantity: removedItem?.quantity ?? 1,
        currency: "THB",
      });
    }
    const next = cart.map(x => x.id === id ? { ...x, quantity: qty } : x).filter(x => x.quantity > 0);
    setCart(next); localStorage.setItem(KEY, JSON.stringify(next));
  };
  const orderText = (orderNumber?: string) => [
    c.orderIntro,
    orderNumber ? `Order: ${orderNumber}` : null,
    `${c.orderName}: ${name.trim()}`,
    `${c.orderContact}: ${contact.trim()}`,
    `${c.shippingAddress}: ${shippingAddress.trim()}`,
    "",
    ...items.map(item => `${item.displayTitle} × ${item.quantity} — ${formatPrice(item.price * item.quantity)}`),
    appliedDiscountAmount>0 ? `${c.subtotal}: ${formatPrice(total)} THB` : null,
    appliedDiscountAmount>0 ? `${c.discountSaved}: -${formatPrice(appliedDiscountAmount)} THB (${appliedDiscount?.code})` : null,
    `${c.orderTotal}: ${formatPrice(payableTotal)} THB`,
    c.payment,
  ].filter((line): line is string => line !== null).join("\n");
  const copyOrder = async () => { try { await navigator.clipboard.writeText(savedOrderText ?? orderText(createdOrderNumber ?? undefined)); setCopied(true); } catch { setCopied(false); } };
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
      if (!navigator.clipboard || typeof ClipboardItem === "undefined" || typeof navigator.clipboard.write !== "function") {
        setQrMessage(lang === "th" ? "เบราว์เซอร์นี้ไม่รองรับการคัดลอกรูป กรุณาใช้ดาวน์โหลด PNG" : lang === "ro" ? "Browserul nu permite copierea imaginii. Folosește descărcarea PNG." : "This browser cannot copy images. Use Download PNG instead.");
        return;
      }
      await navigator.clipboard.write([new ClipboardItem({ "image/png": file })]);
      setQrMessage(lang === "th" ? "คัดลอกรูป QR แล้ว วางในแชตด้วย Ctrl+V" : lang === "ro" ? "Imaginea QR a fost copiată. Lipește-o în chat cu Ctrl+V." : "QR image copied. Paste it into the chat with Ctrl+V.");
      setShareOpen(false);
    } catch {
      setQrMessage(lang === "th" ? "คัดลอกรูปไม่สำเร็จ กรุณาใช้ดาวน์โหลด PNG" : lang === "ro" ? "Copierea imaginii a eșuat. Folosește descărcarea PNG." : "Could not copy image. Use Download PNG instead.");
    }
  };
  const qrShareUrl = `https://ibuzz.wtf/promptpay-share.html?preview=3&lang=${lang}`;
  const copyQrLink = async () => {
    try {
      await navigator.clipboard.writeText(qrShareUrl);
      setQrMessage(lang === "th" ? "คัดลอกลิงก์ QR แล้ว" : lang === "ro" ? "Linkul QR a fost copiat" : "QR link copied");
      setShareOpen(false);
    } catch {
      window.prompt(lang === "th" ? "คัดลอกลิงก์ QR" : lang === "ro" ? "Copiază linkul QR" : "Copy QR link", qrShareUrl);
    }
  };
  const openSocialShare = (platform: "facebook" | "whatsapp" | "line" | "telegram" | "x") => {
    const caption = lang === "th" ? "คิวอาร์โค้ด PromptPay" : lang === "ro" ? "Cod QR PromptPay" : "PromptPay QR";
    const encodedUrl = encodeURIComponent(qrShareUrl);
    const encodedText = encodeURIComponent(caption + " " + qrShareUrl);
    const targets: Record<typeof platform, string> = {
      facebook: "https://www.facebook.com/sharer/sharer.php?u=" + encodedUrl,
      whatsapp: "https://wa.me/?text=" + encodedText,
      line: "https://line.me/R/msg/text/?" + encodedText,
      telegram: "https://t.me/share/url?url=" + encodedUrl + "&text=" + encodeURIComponent(caption),
      x: "https://x.com/compose/post?text=" + encodedText,
    };
    window.open(targets[platform], "_blank", "noopener,noreferrer");
    setShareOpen(false);
  };
  const shareQr = async () => {
    // Only use the native file-share sheet on mobile. On Windows desktop it
    // often has no targets and shows an empty "Share" panel.
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
  const openLine = async () => {
    if (placing) return;
    const lineWindow = window.open("about:blank", "_blank");
    setPlacing(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        lineWindow?.close();
        toast.error(lang === "th" ? "เข้าสู่ระบบหรือสร้างบัญชีก่อนสั่งซื้อ เพื่อติดตามสถานะคำสั่งซื้อ" : lang === "ro" ? "Autentifică-te sau creează un cont înainte de comandă pentru a o putea urmări." : "Sign in or create an account before ordering so you can track it.");
        window.location.href = "/dashboard";
        return;
      }
      let orderNumber = createdOrderNumber;
      if (!orderNumber) {
        const { data, error } = await (supabase as any).rpc("create_customer_order", {
          p_buyer_name: name.trim(),
          p_buyer_contact: contact.trim(),
          p_shipping_address: shippingAddress.trim(),
          p_items: items.map(item => ({ id: item.id, quantity: item.quantity })),
          p_discount_code: appliedDiscountAmount > 0 ? appliedDiscount?.code ?? null : null,
        });
        if (error) throw error;
        orderNumber = typeof data?.order_number === "string" ? data.order_number : null;
        if (!orderNumber) throw new Error("Order number was not returned");
        setCreatedOrderNumber(orderNumber);
        trackEvent("order_request_created", {
          value: payableTotal,
          currency: "THB",
          item_count: items.length,
          quantity: items.reduce((sum, item) => sum + item.quantity, 0),
          payment_method: "promptpay_line",
        });
        setSavedOrderText(orderText(orderNumber));
        localStorage.removeItem(KEY);
        setCart([]);
      }
      const message = savedOrderText ?? orderText(orderNumber);
      setSavedOrderText(message);
      try { await navigator.clipboard.writeText(message); setCopied(true); } catch { setCopied(false); /* LINE can still be opened; the order is safely saved in the account. */ }
      if (lineWindow) lineWindow.location.href = lineLink();
      else window.location.href = lineLink();
      toast.success(lang === "th" ? `บันทึกคำสั่งซื้อ ${orderNumber} แล้ว` : lang === "ro" ? `Comanda ${orderNumber} a fost salvată` : `Order ${orderNumber} saved`);
    } catch (error) {
      lineWindow?.close();
      toast.error(error instanceof Error ? error.message : (lang === "th" ? "บันทึกคำสั่งซื้อไม่สำเร็จ" : lang === "ro" ? "Comanda nu a putut fi salvată" : "Could not save the order"));
    } finally {
      setPlacing(false);
    }
  };

  return <main className="mx-auto w-full max-w-3xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 sm:py-8">
    <div className="space-y-1"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">iBuzz.wtf · Market</p><h1 className="text-2xl font-bold sm:text-3xl">{c.checkout}</h1><p className="text-sm leading-relaxed text-muted-foreground">{c.intro}</p></div>
    {isSignedIn === false && <section className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm leading-relaxed text-muted-foreground">{c.accountNotice}</p><Button asChild className="min-h-11 shrink-0"><Link to="/dashboard">{c.accountAction}</Link></Button></section>}
    {loading ? <p>{c.loading}</p> : !items.length ? <div className="rounded-xl border p-6 text-center"><ShoppingBag className="mx-auto mb-3 h-8 w-8"/><p className="font-semibold">{c.empty}</p><Button asChild className="mt-4"><Link to="/shop" search={{ lang }}>{c.browse}</Link></Button></div> : <>
      <section className="space-y-3">{items.map(p => <div key={p.id} className="space-y-3 rounded-xl border border-border/70 p-3 sm:flex sm:items-center sm:gap-3 sm:space-y-0 sm:p-4"><div className="min-w-0 sm:flex-1"><p className="break-words font-medium leading-snug">{p.displayTitle}</p><p className="mt-1 text-sm text-muted-foreground">{formatPrice(p.price)} {c.each} · {p.stock} {c.stock}</p></div><div className="flex items-center justify-between gap-3 sm:justify-end"><div className="flex items-center gap-2"><Button size="icon" variant="outline" aria-label={c.decrease} onClick={() => updateQty(p.id, p.quantity - 1)}><Minus className="h-4 w-4"/></Button><span className="w-5 text-center tabular-nums">{p.quantity}</span><Button size="icon" variant="outline" aria-label={c.increase} disabled={p.quantity >= p.stock} onClick={() => updateQty(p.id, p.quantity + 1)}><Plus className="h-4 w-4"/></Button><Button size="icon" variant="ghost" aria-label={c.remove} onClick={() => updateQty(p.id, 0)}><Trash2 className="h-4 w-4"/></Button></div><strong className="shrink-0 text-right">{formatPrice(Number(p.price) * p.quantity)}</strong></div></div>)}</section>
      <section className="rounded-xl border border-border/70 p-4 sm:p-5"><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"><label className="space-y-1 text-sm text-muted-foreground">{c.discountCode}<Input value={discountCode} maxLength={40} disabled={!!createdOrderNumber} onChange={e=>{setDiscountCode(e.target.value.toUpperCase());setAppliedDiscount(null);}} placeholder="IBUZZ10"/></label><Button type="button" variant="outline" className="self-end" disabled={!!createdOrderNumber||!discountCode.trim()} onClick={()=>void applyDiscount()}>{c.applyDiscount}</Button></div><div className="mt-4 space-y-1 border-t border-border/50 pt-3 text-sm"><div className="flex items-center justify-between gap-3"><span>{c.subtotal}</span><span className="tabular-nums">{formatPrice(total)} THB</span></div>{appliedDiscountAmount>0&&<div className="flex items-center justify-between gap-3 text-emerald-600"><span>{c.discountSaved} · {appliedDiscount?.code}</span><span className="tabular-nums">−{formatPrice(appliedDiscountAmount)} THB</span></div>}<div className="flex items-start justify-between gap-3 pt-1 text-base font-bold sm:text-lg"><span>{c.total}</span><span className="shrink-0 text-right tabular-nums">{formatPrice(payableTotal)} THB</span></div></div><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.totalNote}</p></section>
      <section className="space-y-4 rounded-xl border border-border/70 p-3 sm:p-5"><h2 className="text-lg font-semibold sm:text-xl">{c.pay}</h2><button type="button" onClick={() => setQrOpen(true)} aria-label={c.qr} className="relative mx-auto block aspect-square w-full max-w-[240px] overflow-hidden rounded-xl border bg-white p-2 transition hover:ring-2 hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-[300px] sm:p-3"><img src="/promptpay-qr.svg" alt={c.qr} className="h-full w-full object-contain select-none" draggable={false}/></button><Dialog open={qrOpen} onOpenChange={setQrOpen}><DialogContent className="w-[calc(100vw-2rem)] max-w-sm rounded-xl p-4 sm:p-6"><DialogTitle>{c.qr}</DialogTitle><div className="relative mx-auto aspect-square w-full max-w-[min(72vw,320px)] overflow-hidden rounded-lg border bg-white"><img src="/promptpay-qr.svg" alt={c.qr} className="h-full w-full object-contain select-none" draggable={false}/></div><Button type="button" className="w-full" onClick={() => setQrOpen(false)}>{lang === "th" ? "กลับไปชำระเงิน" : lang === "ro" ? "Înapoi la plată" : "Back to checkout"}</Button></DialogContent></Dialog><Dialog open={shareOpen} onOpenChange={setShareOpen}><DialogContent className="w-[calc(100vw-2rem)] max-w-sm rounded-xl p-5"><DialogTitle>{lang === "th" ? "แชร์รูป QR PromptPay" : lang === "ro" ? "Partajează imaginea QR PromptPay" : "Share PromptPay QR image"}</DialogTitle><p className="text-sm text-muted-foreground">{lang === "th" ? "แชร์ลิงก์ที่เปิดหน้ารหัส QR PromptPay ผู้รับสามารถเปิดลิงก์เพื่อดู QR ได้" : lang === "ro" ? "Partajează un link către pagina QR PromptPay. Destinatarul poate deschide linkul pentru a vedea codul QR." : "Share a link that opens the PromptPay QR viewer page. Recipients can open the link to see the QR."}</p><div className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" className="min-h-11" onClick={() => void openSocialShare("facebook")}>Facebook</Button><Button type="button" variant="outline" className="min-h-11" onClick={() => void openSocialShare("whatsapp")}>WhatsApp</Button><Button type="button" variant="outline" className="min-h-11" onClick={() => void openSocialShare("line")}>LINE</Button><Button type="button" variant="outline" className="min-h-11" onClick={() => void openSocialShare("telegram")}>Telegram</Button><Button type="button" variant="outline" className="min-h-11" onClick={() => void openSocialShare("x")}>X</Button><Button type="button" variant="outline" className="min-h-11" onClick={() => void copyQrLink()}><Copy className="mr-2 h-4 w-4"/>{lang === "th" ? "คัดลอกลิงก์ QR" : lang === "ro" ? "Copiază linkul QR" : "Copy QR link"}</Button><Button type="button" variant="outline" className="min-h-11" onClick={() => void copyQrImage()}><Copy className="mr-2 h-4 w-4"/>{lang === "th" ? "คัดลอกรูปภาพ" : lang === "ro" ? "Copiază imaginea" : "Copy image"}</Button><Button type="button" className="col-span-2 min-h-11" onClick={() => { setShareOpen(false); void downloadQr(); }}><Download className="mr-2 h-4 w-4"/>{lang === "th" ? "ดาวน์โหลดรูป PNG" : lang === "ro" ? "Descarcă imaginea PNG" : "Download PNG image"}</Button></div></DialogContent></Dialog><div className="mx-auto grid w-full max-w-[280px] grid-cols-2 gap-2 sm:max-w-sm"><Button type="button" variant="outline" className="h-auto min-h-11 w-full whitespace-normal px-2 py-2 text-xs sm:text-sm" onClick={() => void downloadQr()}><Download className="mr-1.5 h-4 w-4 shrink-0"/>{c.saveQr}</Button><Button type="button" variant="outline" className="h-auto min-h-11 w-full whitespace-normal px-2 py-2 text-xs sm:text-sm" onClick={() => void shareQr()}><Share2 className="mr-1.5 h-4 w-4 shrink-0"/>{c.shareQr}</Button></div>{qrMessage && <p role="status" className="text-center text-xs text-muted-foreground">{qrMessage}</p>}<p className="text-sm leading-relaxed">{c.scan}<strong>{formatPrice(payableTotal)}</strong>. {c.staticQr}</p><p className="rounded-lg bg-amber-500/10 p-3 text-sm leading-relaxed text-amber-700 dark:text-amber-300">{c.warning}</p></section>
      <section className="space-y-4 rounded-xl border border-border/70 p-3 sm:p-5"><h2 className="text-lg font-semibold sm:text-xl">{c.send}</h2><div className="space-y-2"><Label htmlFor="buyer-name">{c.name}</Label><Input id="buyer-name" value={name} onChange={e => setName(e.target.value)} placeholder={c.namePlaceholder} required/></div><div className="space-y-2"><Label htmlFor="buyer-contact">{c.contact}</Label><Input id="buyer-contact" value={contact} onChange={e => setContact(e.target.value)} placeholder={c.contactPlaceholder} required/></div><div className="space-y-2"><Label htmlFor="shipping-address">{c.shippingAddress}</Label><Textarea id="shipping-address" value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} placeholder={c.shippingAddressPlaceholder} minLength={10} maxLength={1000} rows={3} required/></div><p className="text-sm text-muted-foreground">{c.instructions}</p><div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><Button className="min-h-11 whitespace-normal" variant="outline" disabled={!name.trim() || !contact.trim() || shippingAddress.trim().length < 10} onClick={() => void copyOrder()}><Copy className="mr-2 h-4 w-4 shrink-0"/>{copied ? c.copied : c.copy}</Button><Button className="min-h-11 whitespace-normal" disabled={!name.trim() || !contact.trim() || shippingAddress.trim().length < 10 || placing} onClick={() => void openLine()}>{placing ? (lang === "th" ? "กำลังบันทึกคำสั่งซื้อ…" : lang === "ro" ? "Se salvează comanda…" : "Saving order…") : createdOrderNumber ? (lang === "th" ? "ดำเนินการต่อใน LINE" : lang === "ro" ? "Continuă în LINE" : "Continue to LINE") : c.openLine}</Button></div><p className="text-xs text-muted-foreground">{c.lineNote}</p></section>
    </>}
    <p className="text-xs text-muted-foreground">{c.pending}</p>
  </main>;
}
