import { createFileRoute } from '@tanstack/react-router';
import { getRouterInstance } from '@tanstack/react-start';
import { collectSitemapPages, isSitemapRouteIncluded, sitemapPathForLocation, sitemapStaticPaths, sitemapXML, type SitemapEntry } from '@/lib/sitemap';
import { repairServices } from '@/lib/service-copy';

const BASE_URL = 'https://ibuzz.wtf';

export const Route = createFileRoute('/sitemap.xml')({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async () => {
        try {
          const router = await getRouterInstance();
          const entries: SitemapEntry[] = sitemapStaticPaths(router).map(path => ({ path }));
          if (isSitemapRouteIncluded(router.routesById['/repair/$service'])) {
            for (const service of repairServices) {
              const location = router.buildLocation({ to: '/repair/$service', params: { service }, search: () => ({}), hash: '' });
              const path = sitemapPathForLocation(router, location, '/repair/$service');
              if (path) entries.push({ path });
            }
          }
          if (isSitemapRouteIncluded(router.routesById['/product/$id'])) {
            const { createClient } = await import('@supabase/supabase-js');
            const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
            const url = process.env['SUPABASE_URL'];
            if (!key || !url) throw new Error('Public catalog configuration unavailable');
            const catalog = createClient(url, key, {
              auth: { persistSession: false, autoRefreshToken: false },
              global: { fetch: (input, init) => {
                const headers = new Headers(init?.headers);
                if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
                headers.set('apikey', key);
                return fetch(input, { ...init, headers });
              } },
            });
            const products = await collectSitemapPages<{ id: string }>(async (offset, end) => {
              const { data, error } = await catalog.from('products').select('id').neq('status', 'hidden').order('id').range(offset, end);
              if (error) throw error;
              return data ?? [];
            });
            for (const product of products) {
              const location = router.buildLocation({ to: '/product/$id', params: { id: product.id }, search: () => ({}), hash: '' });
              const path = sitemapPathForLocation(router, location, '/product/$id');
              if (path) entries.push({ path });
            }
          }
          if (entries.length === 0) return new Response('No discoverable pages', { status: 404, headers: { 'Cache-Control': 'no-store' } });
          return new Response(sitemapXML(BASE_URL, entries), {
            headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' },
          });
        } catch (error) {
          console.error('Sitemap generation failed', error);
          return new Response('Sitemap unavailable', { status: 503, headers: { 'Cache-Control': 'no-store' } });
        }
      },
    },
  },
});