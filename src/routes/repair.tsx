import { createFileRoute, Outlet } from '@tanstack/react-router';
export const Route=createFileRoute('/repair')({staticData: { sitemap: false },component:()=> <Outlet/>});
