import {createFileRoute} from '@tanstack/react-router';
import {ServicePage} from '@/components/ServicePage';
import {pageHead} from '@/lib/service-copy';
export const Route=createFileRoute('/digital')({staticData: { sitemap: true },head:()=>pageHead('Digital Development','Business websites, online stores, custom applications, integrations and maintenance.'),component:()=> <ServicePage kind="digital"/>});
