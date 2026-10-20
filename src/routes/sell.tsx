import {createFileRoute} from '@tanstack/react-router';
import {useT} from '@/lib/i18n';
import {copy,pageHead} from '@/lib/service-copy';
import {EnquiryForm} from '@/components/EnquiryForm';
import {ContactButtons} from '@/components/ContactButtons';
export const Route=createFileRoute('/sell')({staticData: { sitemap: true },head:()=>pageHead('Sell Your Device','Offer broken or working smartphones, digital cameras and other electronics for assessment.'),component:Sell});
function Sell(){const {lang}=useT();return <div className="mx-auto max-w-xl px-5 py-10"><p className="text-sm font-bold text-primary-soft">{copy(lang,'broken')}</p><h1 className="mt-3 text-3xl font-bold">{copy(lang,'sell')}</h1><p className="mt-4 text-muted-foreground">{copy(lang,'assessment')}</p><div className="mt-8"><EnquiryForm kind="sell"/></div><div className="mt-8"><ContactButtons/></div></div>}
