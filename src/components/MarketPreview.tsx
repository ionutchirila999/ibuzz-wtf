import { Suspense } from 'react';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ShoppingBag, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useT } from '@/lib/i18n';
import { homeCopy } from '@/lib/home-copy';
import { Button } from '@/components/ui/button';
import type { Product } from "@/lib/shop";
import { ProductCard } from '@/components/ProductCard';

export const previewQuery = queryOptions({queryKey:['homepage-market'],staleTime:30000,queryFn:async()=>{
 // Avoid ordering by optional schema columns in SQL: older databases may not have
 // is_featured yet, which would otherwise hide the entire homepage product preview.
 const {data,error}=await (supabase as any).from('products').select('*').neq('status','hidden').order('created_at',{ascending:false});
 if(error)return {products:[],failed:true};
 // Promote featured, available items first; sold listings remain visible after stock.
 const products=((data??[]) as Product[]).sort((a,b)=>{
   const featured=Number(!!b.is_featured)-Number(!!a.is_featured);
   if(featured)return featured;
   const available=Number(a.status==="sold"||Number(a.stock)<=0)-Number(b.status==="sold"||Number(b.stock)<=0);
   if(available)return available;
   return new Date(b.created_at).getTime()-new Date(a.created_at).getTime();
 }).slice(0,4);
 return {products,failed:false};
}});
function Listings(){const {lang}=useT();const {data}=useSuspenseQuery(previewQuery);return data.products.length?<div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{data.products.map(p=><ProductCard key={p.id} p={p}/>)}</div>:<div className="flex flex-col items-center border-y border-border/50 py-10 text-center"><ShoppingBag className="mb-4 h-8 w-8 text-azure"/><p className="max-w-md text-sm leading-6 text-muted-foreground">{homeCopy(lang,data.failed?'unavailable':'empty')}</p></div>;}
export function MarketPreview(){const {lang}=useT();const h=(key:Parameters<typeof homeCopy>[1])=>homeCopy(lang,key);return <section className="section-space mx-auto max-w-6xl px-5 sm:px-8" aria-labelledby="market-title">
 <p className="section-eyebrow">MARKET</p><div className="mt-3 grid gap-4 md:grid-cols-[1fr_auto] md:items-end"><div><h2 id="market-title" className="section-heading">{h('latest')}</h2><p className="mt-3 text-muted-foreground">{h('marketNote')}</p></div><Button asChild variant="outline" className="justify-self-start"><Link to="/market">{h('products')}<ArrowUpRight/></Link></Button></div>
 <div className="mb-7 mt-6 flex flex-wrap gap-2">{([{label:'electronics',category:'technology'},{label:'cameras',category:'technology',sub:'Digital cameras & lenses'},{label:'computers',category:'technology',sub:'Computer components & accessories'},{label:'clothing',category:'clothing'},{label:'footwear',category:'footwear'}] as const).map(item=><Button asChild variant="ghost" className="h-auto min-h-10 rounded-full border border-border/60 px-4 py-2 text-sm" key={item.label}><Link to="/market" search={{category:item.category,...('sub' in item?{sub:item.sub}:{})}}>{h(item.label)}</Link></Button>)}</div>
 <Suspense fallback={<div className="grid grid-cols-2 gap-4 md:grid-cols-4" aria-busy="true">{[1,2,3,4].map(n=><div key={n} className="aspect-square rounded-lg bg-muted/40"/>)}</div>}><Listings/></Suspense>
 </section>;}