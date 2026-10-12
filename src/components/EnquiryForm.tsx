import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useT } from '@/lib/i18n';
import { copy, repairServices, digitalServices } from '@/lib/service-copy';
import { enquirySchema, type EnquiryInput } from '@/lib/enquiry-schema';
import { submitEnquiry } from '@/lib/enquiries.functions';
export function EnquiryForm({kind,service}:{kind:'repair'|'digital'|'sell';service?:string}) {
 const {lang} = useT(); const c = (key:Parameters<typeof copy>[1]) => copy(lang,key);
  const send = useServerFn(submitEnquiry); const [busy,setBusy] = useState(false); const [done,setDone] = useState(false); const [error,setError] = useState(''); const [photos,setPhotos] = useState<EnquiryInput['photos']>([]);
  const fetchCheck = useServerFn(getHumanCheck); const [check,setCheck] = useState<{question:string;token:string}|null>(null); const [answer,setAnswer] = useState('');
  const loadCheck = () => { fetchCheck().then(setCheck).catch(()=>setError(c('error'))); };
  useEffect(() => { loadCheck(); }, []);
 async function upload(files:FileList|null) {
  if(!files)return; setError(''); setBusy(true);
  try { const next = [...photos]; for(const file of Array.from(files)) {
   if(next.length>=4 || !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>5000000) throw new Error();
   const bitmap = await createImageBitmap(file); const scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height)); const canvas=document.createElement('canvas'); canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale); const ctx=canvas.getContext('2d'); if(!ctx)throw new Error();ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
   const data = canvas.toDataURL('image/jpeg',0.75).split(',')[1]; if(!data || data.length>1333332)throw new Error(); next.push({data,mime:'image/jpeg'});
  } setPhotos(next); } catch {setError(c('error'));} finally {setBusy(false);}
 }
  async function submit(e:React.FormEvent<HTMLFormElement>) {
   e.preventDefault();setError(''); const f=new FormData(e.currentTarget);
   const parsed=enquirySchema.safeParse({kind,name:f.get('name'),contact:f.get('contact'),service:f.get('service'),description:f.get('description'),brand:f.get('brand')??'',model:f.get('model')??'',deviceCondition:f.get('deviceCondition')??'broken',price:f.get('price')?Number(f.get('price')):null,photos,checkToken:check?.token??'',checkAnswer:String(f.get('checkAnswer')??''),website:String(f.get('website')??'')});
   if(!parsed.success){setError(c('error'));return;}setBusy(true);
   try {const res=await send({data:parsed.data});if(res.saved)setDone(true);else{setError(c(res.status==='cooldown'?'cooldown':'humanWrong'));if(res.status==='human'){setAnswer('');loadCheck();}}}catch{setError(c('error'));}finally{setBusy(false);}
  }
 if(done)return <div role="status" className="py-12 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-success"/><h2 className="mt-4 text-2xl font-bold">{c('done')}</h2><p className="mt-3 text-muted-foreground">{c('doneDetail')}</p>{kind==='sell'&&<p className="mt-3 text-sm text-muted-foreground">{c('assessment')}</p>}</div>;
 const services=kind==='digital'?digitalServices:repairServices;
 return <form onSubmit={submit} className="space-y-5">
   <div><Label htmlFor={`${kind}-service`}>{c(kind==='sell'?'device':'service')}</Label><select id={`${kind}-service`} name="service" defaultValue={service} className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-sm">{services.map(s=><option key={s} value={copy('en',s)}>{c(s)}</option>)}</select></div>
  {kind==='sell'&&<><div className="grid grid-cols-2 gap-3"><div><Label htmlFor="brand">{c('brand')}</Label><Input id="brand" name="brand" required maxLength={100}/></div><div><Label htmlFor="model">{c('model')}</Label><Input id="model" name="model" required maxLength={100}/></div></div><div><Label htmlFor="deviceCondition">{c('condition')}</Label><select id="deviceCondition" name="deviceCondition" className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3"><option value="broken">{c('faulty')}</option><option value="working">{c('working')}</option></select></div></>}
  <div><Label htmlFor={`${kind}-description`}>{c('details')}</Label><Textarea id={`${kind}-description`} name="description" required maxLength={2000} rows={5}/></div>
  {kind==='sell'&&<div><Label htmlFor="price">{c('price')}</Label><Input id="price" name="price" type="number" min={0} step="0.01"/></div>}
  <div><Label htmlFor={`${kind}-photos`}>{c('photos')}</Label><Input id={`${kind}-photos`} type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>upload(e.target.files)}/><div className="mt-2 flex flex-wrap gap-2">{photos.map((p,i)=><div className="relative" key={i}><img src={`data:${p.mime};base64,${p.data}`} alt={`${c('photos')} ${i+1}`} className="h-20 w-20 rounded-md object-cover"/><Button type="button" size="icon" variant="outline" aria-label={`Remove photo ${i+1}`} className="absolute right-0 top-0 h-6 w-6" onClick={()=>setPhotos(photos.filter((_,n)=>n!==i))}><X className="h-3 w-3"/></Button></div>)}</div></div>
  <div><Label htmlFor={`${kind}-name`}>{c('name')}</Label><Input id={`${kind}-name`} name="name" required maxLength={100}/></div><div><Label htmlFor={`${kind}-contact`}>{c('contact')}</Label><Input id={`${kind}-contact`} name="contact" required maxLength={150}/></div>
   <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden"><label htmlFor={`${kind}-website`}>Website</label><input id={`${kind}-website`} name="website" tabIndex={-1} autoComplete="off"/></div>
   <div><Label htmlFor={`${kind}-check`}>{c('humanCheck')} <span className="font-semibold text-foreground">{check?`${check.question} = ?`:'…'}</span></Label><Input id={`${kind}-check`} name="checkAnswer" inputMode="numeric" required maxLength={3} value={answer} onChange={e=>setAnswer(e.target.value)} className="mt-1 w-28"/></div>
   {error&&<p role="alert" className="text-destructive">{error}</p>}<Button type="submit" variant="glow" size="lg" className="w-full" disabled={busy||!check}>{c(busy?'sending':'send')}</Button>
 </form>;
}
