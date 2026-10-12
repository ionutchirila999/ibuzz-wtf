import { createFileRoute } from '@tanstack/react-router';
import { pageHead } from '@/lib/service-copy';
import { homeCopy } from '@/lib/home-copy';
import { useT } from '@/lib/i18n';
import { ContactButtons } from '@/components/ContactButtons';
export const Route=createFileRoute('/terms')({head:()=>pageHead('Terms','Assessment, quotations and product enquiries at iBuzz.wtf.'),component:Terms});
function Terms(){const {lang}=useT();return <article className="mx-auto max-w-3xl px-5 py-16"><h1 className="section-heading">{homeCopy(lang,'terms')}</h1><p className="my-8 leading-8 text-muted-foreground">{homeCopy(lang,'termsText')}</p><ContactButtons/></article>;}