import { createFileRoute } from '@tanstack/react-router';
import { pageHead } from '@/lib/service-copy';
import { homeCopy } from '@/lib/home-copy';
import { useT } from '@/lib/i18n';
import { ContactButtons } from '@/components/ContactButtons';
export const Route=createFileRoute('/privacy')({staticData: { sitemap: true },head:()=>pageHead('Privacy Policy','How iBuzz.wtf uses information submitted with customer enquiries.'),component:Privacy});
function Privacy(){const {lang}=useT();return <article className="mx-auto max-w-3xl px-5 py-16"><h1 className="section-heading">{homeCopy(lang,'privacy')}</h1><p className="my-8 leading-8 text-muted-foreground">{homeCopy(lang,'privacyText')}</p><ContactButtons/></article>;}