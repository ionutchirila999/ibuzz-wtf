import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, lineLink } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Minus, Plus, Trash2, Copy, ShoppingBag } from "lucide-react";

type CartItem = { id: string; quantity: number };
type CartProduct = { id: string; title: string; title_th?: string | null; title_ro?: string | null; price: number; stock: number; status: string };
const KEY = "ibuzz-cart-v1";
const readCart = (): CartItem[] => { try { const v = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(v) ? v.filter((x) => typeof x.id === "string" && Number.isInteger(x.quantity) && x.quantity > 0) : []; } catch { return []; } };
export const Route = createFileRoute("/checkout")({ component: Checkout });
function Checkout() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => { const c = readCart(); setCart(c); if (!c.length) { setLoading(false); return; } void supabase.from("products").select("id,title,title_th,title_ro,price,stock,status").in("id", c.map(x=>x.id)).then(({data,error}) => { if (!error && data) setProducts(data as CartProduct[]); setLoading(false); }); }, []);
  const items = useMemo(() => cart.flatMap(c => { const p=products.find(x=>x.id===c.id); return p && p.status!=="sold" && p.status!=="hidden" && p.stock>0 ? [{...p, quantity: Math.min(c.quantity,p.stock)}] : []; }), [cart,products]);
  const total = items.reduce((sum,p)=>sum+Number(p.price)*p.quantity,0);
  const orderText = () => `Hello iBuzz.wtf! I'd like to place an order.\nName: ${name.trim()}\nContact: ${contact.trim()}\n\n${items.map(p=>`${p.title} × ${p.quantity} = ฿${(Number(p.price)*p.quantity).toLocaleString("en-US",{maximumFractionDigits:2})}`).join("\n")}\n\nTOTAL: ฿${total.toLocaleString("en-US",{maximumFractionDigits:2})}\nPayment: PromptPay (pending manual verification). I will attach my payment slip in this LINE chat. Please confirm stock and payment before processing.`;
  const updateQty=(id:string,qty:number)=>{const next=cart.map(x=>x.id===id?{...x,quantity:qty}:x).filter(x=>x.quantity>0);setCart(next);localStorage.setItem(KEY,JSON.stringify(next));};
  const copyOrder=async()=>{try{await navigator.clipboard.writeText(orderText());setCopied(true);}catch{setCopied(false);}};
  const openLine=()=>{void copyOrder();window.open(lineLink(),"_blank","noopener,noreferrer");};
  return <main className="mx-auto max-w-3xl space-y-6 px-4 py-8"><div><p className="text-sm text-muted-foreground">iBuzz.wtf · Market</p><h1 className="mt-1 text-3xl font-bold">Checkout</h1><p className="mt-2 text-sm text-muted-foreground">Review your items, pay with PromptPay, then send the order and payment slip through LINE.</p></div>
  {loading ? <p>Loading cart…</p> : !items.length ? <div className="rounded-xl border p-6 text-center"><ShoppingBag className="mx-auto mb-3 h-8 w-8"/><p className="font-semibold">Your cart is empty</p><Button asChild className="mt-4"><Link to="/shop">Browse Market</Link></Button></div> : <>
  <section className="space-y-3">{items.map(p=><div key={p.id} className="flex items-center gap-3 rounded-xl border p-4"><div className="min-w-0 flex-1"><p className="font-medium">{p.title}</p><p className="text-sm text-muted-foreground">{formatPrice(p.price)} each · {p.stock} in stock</p></div><div className="flex items-center gap-2"><Button size="icon" variant="outline" aria-label="Decrease quantity" onClick={()=>updateQty(p.id,p.quantity-1)}><Minus className="h-4 w-4"/></Button><span className="w-5 text-center">{p.quantity}</span><Button size="icon" variant="outline" aria-label="Increase quantity" disabled={p.quantity>=p.stock} onClick={()=>updateQty(p.id,p.quantity+1)}><Plus className="h-4 w-4"/></Button><Button size="icon" variant="ghost" aria-label="Remove item" onClick={()=>updateQty(p.id,0)}><Trash2 className="h-4 w-4"/></Button></div><strong className="w-24 text-right">{formatPrice(Number(p.price)*p.quantity)}</strong></div>)}</section>
  <section className="rounded-xl border p-5"><div className="flex items-center justify-between text-lg font-bold"><span>Total due</span><span>{formatPrice(total)} THB</span></div><p className="mt-2 text-sm text-muted-foreground">Prices and available stock are reloaded from the product database. Confirm the total before paying.</p></section>
  <section className="space-y-4 rounded-xl border p-5"><h2 className="text-xl font-semibold">1. Pay with PromptPay</h2><div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-lg border bg-white" aria-label="PromptPay QR code"><img src="/promptpay-qr.jpg" alt="PromptPay QR code" className="absolute left-[-50%] top-[-134%] w-[200%] max-w-none" /></div><p className="text-sm">Open your Thai banking app, scan the QR above, and enter the exact total shown here: <strong>{formatPrice(total)}</strong>. The QR is static, so you must enter the amount yourself.</p><p className="text-sm text-amber-700 dark:text-amber-300">Do not pay if the QR or recipient details shown by your banking app do not match what you expect.</p></section>
  <section className="space-y-4 rounded-xl border p-5"><h2 className="text-xl font-semibold">2. Send order to LINE</h2><div className="space-y-2"><Label htmlFor="buyer-name">Your name</Label><Input id="buyer-name" value={name} onChange={e=>setName(e.target.value)} placeholder="Name for the order" required/></div><div className="space-y-2"><Label htmlFor="buyer-contact">Phone or LINE contact</Label><Input id="buyer-contact" value={contact} onChange={e=>setContact(e.target.value)} placeholder="How we can contact you" required/></div><p className="text-sm text-muted-foreground">Copy the order message, open LINE, send it to iBuzz.wtf, and attach your payment slip in that chat.</p><div className="grid gap-2 sm:grid-cols-2"><Button variant="outline" disabled={!name.trim()||!contact.trim()} onClick={()=>void copyOrder()}><Copy className="mr-2 h-4 w-4"/>{copied?"Order copied":"Copy order details"}</Button><Button disabled={!name.trim()||!contact.trim()} onClick={openLine}>Open LINE to send order</Button></div><p className="text-xs text-muted-foreground">Opening LINE does not send the message automatically. Paste the copied order details and attach your slip yourself.</p></section>
  </>}
  <p className="text-xs text-muted-foreground">Payment status remains pending until iBuzz.wtf manually checks the funds. Sending a slip alone does not confirm payment.</p></main>;
}
