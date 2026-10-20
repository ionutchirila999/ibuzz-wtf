import { createFileRoute, notFound, Link } from '@tanstack/react-router';
import { copy, repairServices, pageHead } from '@/lib/service-copy';
import { useT } from '@/lib/i18n';
import { EnquiryForm } from '@/components/EnquiryForm';
import { ContactButtons } from '@/components/ContactButtons';
export const Route=createFileRoute('/repair/$service')({staticData: { sitemap: true },loader:({params})=>{const service=repairServices.find(s=>s===params.service);if(!service)throw notFound();return {service};},head:({loaderData})=>pageHead(loaderData?`${copy('en',loaderData.service)} Repair`:'Repair service','Request diagnostics and a repair quote from iBuzz.wtf.'),component:RepairDetail});
function RepairDetail(){const {service}=Route.useLoaderData();const {lang}=useT();return <div className="mx-auto max-w-3xl px-5 py-10"><Link to="/repair" className="text-primary-soft">← {copy(lang,'repair')}</Link><h1 className="mt-6 text-3xl font-bold">{copy(lang,service)}</h1><p className="mb-8 mt-4 text-muted-foreground">{copy(lang,'repairLead')}</p><h2 className="mb-5 text-xl font-semibold">{copy(lang,'quote')}</h2><EnquiryForm kind="repair" service={copy("en",service)}/><div className="mt-8"><ContactButtons/></div></div>}
