import { createFileRoute } from '@tanstack/react-router';
import { ServicePage } from '@/components/ServicePage';
import { pageHead } from '@/lib/service-copy';
export const Route=createFileRoute('/repair/')({head:()=>pageHead('Electronics Repair','Diagnostics and repair for phones, cameras, computers, screens and electric scooters.'),component:()=> <ServicePage kind="repair"/>});
