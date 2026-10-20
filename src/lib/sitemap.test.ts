import { describe, expect, it, vi } from 'vitest';
import { collectSitemapPages, isSitemapRouteIncluded } from './sitemap';
import type { AnyRoute } from '@tanstack/react-router';

describe('sitemap public inventory', () => {
  it('collects every batch using contiguous ranges', async () => {
    const read = vi.fn(async (offset: number) => [[{ id: 'available' }, { id: 'sold' }], [{ id: 'later' }], []][offset === 0 ? 0 : offset === 2 ? 1 : 2] ?? []);
    expect(await collectSitemapPages(read, 2)).toEqual([{ id: 'available' }, { id: 'sold' }, { id: 'later' }]);
    expect(read.mock.calls).toEqual([[0, 1], [2, 3], [3, 4]]);
  });
  it('rejects a later-batch failure rather than returning partial rows', async () => {
    const read = vi.fn().mockResolvedValueOnce([{ id: 'first' }]).mockRejectedValueOnce(new Error('Public read failed'));
    await expect(collectSitemapPages(read)).rejects.toThrow('Public read failed');
  });
  it('does not allow a child to override a private subtree', () => {
    const parent = { options: { staticData: { sitemap: 'exclude-subtree' } } } as unknown as AnyRoute;
    const child = { options: { staticData: { sitemap: true } }, parentRoute: parent } as unknown as AnyRoute;
    expect(isSitemapRouteIncluded(child)).toBe(false);
  });
});