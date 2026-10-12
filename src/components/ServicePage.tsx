import { Link } from '@tanstack/react-router';
import { ArrowUpRight, Wrench, Code2 } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { copy, repairServices, digitalServices } from '@/lib/service-copy';
import { Button } from '@/components/ui/button';
import { EnquiryForm } from './EnquiryForm';
import { ContactButtons } from './ContactButtons';
import { RepairAssistant } from './RepairAssistant';
export function ServicePage({kind}:{kind:'repair'|'digital'}) {
 const {lang}=useT();const c=(key:Parameters<typeof copy>[1])=>copy(lang,key);const services=kind==='repair'?repairServices:digitalServices;const Icon=kind==='repair'?Wrench:Code2;
 return <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14"><div className="mb-10 max-w-3xl"><p className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-primary-soft"><Icon className="h-5 w-5"/>{c(kind)}</p><h1 className="text-4xl font-bold sm:text-5xl">iBuzz.wtf {c(kind)}</h1><p className="mt-5 text-lg text-muted-foreground">{c(kind==='repair'?'repairLead':'digitalLead')}</p><Button asChild variant="glow" className="mt-6"><a href="#quote">{c('quote')}<ArrowUpRight/></a></Button>{kind==='digital'&&<Button asChild variant="outline" className="ml-3 mt-6"><Link to="/portfolio">{c('portfolio')}</Link></Button>}</div>
 {kind==='repair'&&<RepairAssistant/>}<div className="grid gap-12 md:grid-cols-[1fr_1fr]"><div><ul className="divide-y border-y">{services.map(s=><li key={s} className="flex items-center justify-between gap-3 py-5 font-medium">{kind==='repair'?<Link to="/repair/$service" params={{service:s}} className="flex w-full items-center justify-between gap-3">{c(s)}<ArrowUpRight className="h-4 w-4 shrink-0 text-azure"/></Link>:c(s)}</li>)}</ul><div className="mt-8"><ContactButtons/></div></div><section id="quote" className="scroll-mt-28"><h2 className="mb-6 text-2xl font-bold">{c('quote')}</h2><EnquiryForm kind={kind}/></section></div></div>;
}
