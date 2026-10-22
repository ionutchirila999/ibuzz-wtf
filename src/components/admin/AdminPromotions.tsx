import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Star, Trash2, Megaphone, Tag } from "lucide-react";

type ProductControl = { id:string; title:string; status:string; stock:number; is_featured:boolean; sold_out_label_en:string; sold_out_label_th:string; sold_out_label_ro:string };
type Discount = { id:string; code:string; discount_type:"percent"|"fixed"; discount_value:number; min_order_amount:number; starts_at:string; expires_at:string|null; max_redemptions:number|null; redemption_count:number; is_active:boolean };
type Banner = { id:string; title:string; body:string|null; image_url:string|null; link_url:string|null; is_active:boolean; sort_order:number; starts_at:string|null; ends_at:string|null };

export function AdminPromotions() {
  const qc = useQueryClient();
  const products = useQuery({queryKey:["promotion-products"],queryFn:async()=>{const {data,error}=await (supabase as any).from("products").select("id,title,status,stock,is_featured,sold_out_label_en,sold_out_label_th,sold_out_label_ro").order("title");if(error)throw error;return (data??[]) as ProductControl[];}});
  const codes = useQuery({queryKey:["discount-codes"],queryFn:async()=>{const {data,error}=await (supabase as any).from("discount_codes").select("*").order("created_at",{ascending:false});if(error)throw error;return (data??[]) as Discount[];}});
  const banners = useQuery({queryKey:["site-banners"],queryFn:async()=>{const {data,error}=await (supabase as any).from("site_banners").select("*").order("sort_order").order("created_at",{ascending:false});if(error)throw error;return (data??[]) as Banner[];}});
  const [codeForm,setCodeForm]=useState({code:"",discount_type:"percent" as "percent"|"fixed",discount_value:"10",min_order_amount:"0",starts_at:new Date().toISOString().slice(0,10),expires_at:"",max_redemptions:"",is_active:true});
  const [bannerForm,setBannerForm]=useState({title:"",body:"",image_url:"",link_url:"",sort_order:"0",starts_at:"",ends_at:"",is_active:false});
  const [labels,setLabels]=useState<Record<string,{en:string;th:string;ro:string}>>({});
  const refresh=async()=>{await Promise.all([qc.invalidateQueries({queryKey:["promotion-products"]}),qc.invalidateQueries({queryKey:["discount-codes"]}),qc.invalidateQueries({queryKey:["site-banners"]}),qc.invalidateQueries({queryKey:["products"]})]);};
  const failed=products.error||codes.error||banners.error;
  if(failed)return <div role="alert" className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive">Promotions and website controls need the latest database migration applied. {String((failed as Error).message??"Could not load settings.")}</div>;
  async function createCode(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const value=Number(codeForm.discount_value),minimum=Number(codeForm.min_order_amount),max=codeForm.max_redemptions.trim()?Number(codeForm.max_redemptions):null;const code=codeForm.code.trim().toUpperCase().replace(/\s+/g,"");if(code.length<3||!Number.isFinite(value)||value<=0||(codeForm.discount_type==="percent"&&value>100)||!Number.isFinite(minimum)||minimum<0||(max!==null&&(!Number.isInteger(max)||max<1))){toast.error("Check the discount code values.");return;}const {data:auth}=await supabase.auth.getUser();const {error}=await (supabase as any).from("discount_codes").insert({code,discount_type:codeForm.discount_type,discount_value:value,min_order_amount:minimum,starts_at:new Date(codeForm.starts_at+"T00:00:00").toISOString(),expires_at:codeForm.expires_at?new Date(codeForm.expires_at+"T23:59:59").toISOString():null,max_redemptions:max,is_active:codeForm.is_active,created_by:auth.user?.id??null});if(error){toast.error(error.message);return;}toast.success("Discount code created");setCodeForm(old=>({...old,code:""}));await refresh();}
  async function createBanner(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const {data:auth}=await supabase.auth.getUser();const {error}=await (supabase as any).from("site_banners").insert({title:bannerForm.title.trim(),body:bannerForm.body.trim()||null,image_url:bannerForm.image_url.trim()||null,link_url:bannerForm.link_url.trim()||null,sort_order:Number(bannerForm.sort_order)||0,starts_at:bannerForm.starts_at?new Date(bannerForm.starts_at+"T00:00:00").toISOString():null,ends_at:bannerForm.ends_at?new Date(bannerForm.ends_at+"T23:59:59").toISOString():null,is_active:bannerForm.is_active,created_by:auth.user?.id??null});if(error){toast.error(error.message);return;}toast.success("Homepage banner saved");setBannerForm({title:"",body:"",image_url:"",link_url:"",sort_order:"0",starts_at:"",ends_at:"",is_active:false});await refresh();}
  async function update(table:string,id:string,values:Record<string,unknown>){const {error}=await (supabase as any).from(table).update(values).eq("id",id);if(error){toast.error(error.message);return;}await refresh();}
  async function remove(table:string,id:string){if(!window.confirm("Delete this item?"))return;const {error}=await (supabase as any).from(table).delete().eq("id",id);if(error){toast.error(error.message);return;}toast.success("Deleted");await refresh();}
  const initialLabels=(p:ProductControl)=>labels[p.id]??{en:p.sold_out_label_en??"Sold out",th:p.sold_out_label_th??"สินค้าหมด",ro:p.sold_out_label_ro??"Stoc epuizat"};
  if(products.isLoading||codes.isLoading||banners.isLoading)return <p className="py-6 text-muted-foreground">Loading promotions…</p>;
  return <div className="space-y-5">
    <section className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2"><Star className="h-4 w-4 text-primary"/><h2 className="font-semibold">Featured products & sold-out labels</h2></div>
      <p className="text-sm text-muted-foreground">Feature items in the Market and customize the sold-out badge in all three storefront languages.</p>
      {(products.data??[]).map(p=>{const l=initialLabels(p);return <div key={p.id} className="space-y-3 rounded-lg border border-border/50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><div className="min-w-0"><p className="font-medium">{p.title}</p><p className="text-xs text-muted-foreground">Stock {p.stock} · {p.status}</p></div><Button size="sm" variant={p.is_featured?"default":"outline"} onClick={()=>void update("products",p.id,{is_featured:!p.is_featured})}><Star className="mr-1 h-4 w-4"/>{p.is_featured?"Featured":"Feature product"}</Button></div>
        <div className="grid gap-2 sm:grid-cols-2"><label className="text-xs text-muted-foreground">Sold-out label · English<Input value={l.en} maxLength={60} onChange={e=>setLabels(old=>({...old,[p.id]:{...l,en:e.target.value}}))}/></label><label className="text-xs text-muted-foreground">ข้อความสินค้าหมด · ไทย<Input value={l.th} maxLength={60} onChange={e=>setLabels(old=>({...old,[p.id]:{...l,th:e.target.value}}))}/></label><label className="text-xs text-muted-foreground sm:col-span-2">Etichetă epuizat · Română<Input value={l.ro} maxLength={60} onChange={e=>setLabels(old=>({...old,[p.id]:{...l,ro:e.target.value}}))}/></label></div>
        <Button size="sm" variant="outline" onClick={()=>void update("products",p.id,{sold_out_label_en:l.en.trim()||"Sold out",sold_out_label_th:l.th.trim()||"สินค้าหมด",sold_out_label_ro:l.ro.trim()||"Stoc epuizat"})}>Save labels</Button>
      </div>})}
    </section>
    <section className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2"><Tag className="h-4 w-4 text-primary"/><h2 className="font-semibold">Discount codes</h2></div>
      <form onSubmit={createCode} className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-muted-foreground">Code<Input required minLength={3} maxLength={40} value={codeForm.code} onChange={e=>setCodeForm({...codeForm,code:e.target.value.toUpperCase()})} placeholder="IBUZZ10"/></label>
        <label className="text-xs text-muted-foreground">Discount type<select value={codeForm.discount_type} onChange={e=>setCodeForm({...codeForm,discount_type:e.target.value as "percent"|"fixed"})} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"><option value="percent">Percentage (%)</option><option value="fixed">Fixed amount (฿)</option></select></label>
        <label className="text-xs text-muted-foreground">Discount value<Input type="number" min="0.01" max={codeForm.discount_type==="percent"?100:undefined} step="0.01" required value={codeForm.discount_value} onChange={e=>setCodeForm({...codeForm,discount_value:e.target.value})}/></label>
        <label className="text-xs text-muted-foreground">Minimum order (฿)<Input type="number" min="0" step="0.01" required value={codeForm.min_order_amount} onChange={e=>setCodeForm({...codeForm,min_order_amount:e.target.value})}/></label>
        <label className="text-xs text-muted-foreground">Starts on<Input type="date" required value={codeForm.starts_at} onChange={e=>setCodeForm({...codeForm,starts_at:e.target.value})}/></label>
        <label className="text-xs text-muted-foreground">Expires on (optional)<Input type="date" min={codeForm.starts_at} value={codeForm.expires_at} onChange={e=>setCodeForm({...codeForm,expires_at:e.target.value})}/></label>
        <label className="text-xs text-muted-foreground">Maximum redemptions (optional)<Input type="number" min="1" step="1" value={codeForm.max_redemptions} onChange={e=>setCodeForm({...codeForm,max_redemptions:e.target.value})}/></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={codeForm.is_active} onChange={e=>setCodeForm({...codeForm,is_active:e.target.checked})}/>Active immediately</label>
        <Button type="submit" className="sm:col-span-2">Create discount code</Button>
      </form>
      <div className="space-y-2">{(codes.data??[]).map(code=><article key={code.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div className="min-w-0"><p className="font-semibold">{code.code} · {code.discount_type==="percent"?code.discount_value+"%": "฿"+code.discount_value}</p><p className="text-xs text-muted-foreground">Used {code.redemption_count}{code.max_redemptions?"/"+code.max_redemptions:""} · Minimum ฿{code.min_order_amount} · {code.expires_at?"Expires "+new Date(code.expires_at).toLocaleDateString():"No expiry"}</p></div><div className="flex gap-2"><Badge variant={code.is_active?"default":"secondary"}>{code.is_active?"Active":"Inactive"}</Badge><Button size="sm" variant="outline" onClick={()=>void update("discount_codes",code.id,{is_active:!code.is_active})}>{code.is_active?"Deactivate":"Activate"}</Button><Button size="icon" variant="ghost" onClick={()=>void remove("discount_codes",code.id)} aria-label={"Delete "+code.code}><Trash2 className="h-4 w-4"/></Button></div></article>)}</div>
    </section>
    <section className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-primary"/><h2 className="font-semibold">Homepage banners</h2></div>
      <form onSubmit={createBanner} className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-muted-foreground">Title<Input required minLength={2} maxLength={180} value={bannerForm.title} onChange={e=>setBannerForm({...bannerForm,title:e.target.value})}/></label>
        <label className="text-xs text-muted-foreground">Link URL (HTTPS)<Input type="url" value={bannerForm.link_url} onChange={e=>setBannerForm({...bannerForm,link_url:e.target.value})} placeholder="https://ibuzz.wtf/shop"/></label>
        <label className="text-xs text-muted-foreground sm:col-span-2">Message<Textarea rows={2} maxLength={2000} value={bannerForm.body} onChange={e=>setBannerForm({...bannerForm,body:e.target.value})}/></label>
        <label className="text-xs text-muted-foreground sm:col-span-2">Image URL (HTTPS)<Input type="url" value={bannerForm.image_url} onChange={e=>setBannerForm({...bannerForm,image_url:e.target.value})}/></label>
        <label className="text-xs text-muted-foreground">Starts on (optional)<Input type="date" value={bannerForm.starts_at} onChange={e=>setBannerForm({...bannerForm,starts_at:e.target.value})}/></label>
        <label className="text-xs text-muted-foreground">Ends on (optional)<Input type="date" min={bannerForm.starts_at||undefined} value={bannerForm.ends_at} onChange={e=>setBannerForm({...bannerForm,ends_at:e.target.value})}/></label>
        <label className="text-xs text-muted-foreground">Display order<Input type="number" step="1" value={bannerForm.sort_order} onChange={e=>setBannerForm({...bannerForm,sort_order:e.target.value})}/></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={bannerForm.is_active} onChange={e=>setBannerForm({...bannerForm,is_active:e.target.checked})}/>Publish banner</label>
        <Button type="submit" className="sm:col-span-2">Save homepage banner</Button>
      </form>
      <div className="space-y-2">{(banners.data??[]).map(banner=><article key={banner.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div className="min-w-0"><p className="font-semibold">{banner.title}</p><p className="text-xs text-muted-foreground">{banner.sort_order} · {banner.starts_at?new Date(banner.starts_at).toLocaleDateString():"Any start"} · {banner.ends_at?new Date(banner.ends_at).toLocaleDateString():"No end"}</p></div><div className="flex gap-2"><Badge variant={banner.is_active?"default":"secondary"}>{banner.is_active?"Published":"Draft"}</Badge><Button size="sm" variant="outline" onClick={()=>void update("site_banners",banner.id,{is_active:!banner.is_active})}>{banner.is_active?"Unpublish":"Publish"}</Button><Button size="icon" variant="ghost" onClick={()=>void remove("site_banners",banner.id)} aria-label={"Delete "+banner.title}><Trash2 className="h-4 w-4"/></Button></div></article>)}</div>
    </section>
  </div>;
}
