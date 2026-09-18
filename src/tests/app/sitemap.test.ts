import { describe, it, expect, vi, afterEach } from 'vitest';
import sitemap from '@/app/sitemap';
import { COMPANY } from '@/lib/company';
import { LOCALES } from '@/i18n/config';

/** Answers by path, so each locale and legal key can return its own payload. */
function mockApi(routes: Record<string, unknown>) {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL) => {
        const url = String(input);
        const match = Object.keys(routes).find(path => url.includes(path));
        if (match == null) return new Response('null', { status: 404 });
        return new Response(JSON.stringify(routes[match]), {
            status: 200,
            headers: { 'content-type': 'application/json' },
        });
    });
}

const urls = (entries: Awaited<ReturnType<typeof sitemap>>) => entries.map(entry => entry.url);

afterEach(() => vi.restoreAllMocks());

describe('sitemap', () => {
    it('lists the legal pages in every locale', async () => {
        mockApi({});
        const listed = urls(await sitemap());

        for (const path of ['/terms', '/privacy', '/cookies']) {
            for (const locale of LOCALES) {
                expect(listed).toContain(`${COMPANY.url}/${locale}${path}`);
            }
        }
    });

    it('leaves the admin pages out, since they are behind a login', async () => {
        mockApi({});
        const listed = urls(await sitemap());

        expect(listed.some(url => new URL(url).pathname.includes('/admin'))).toBe(false);
    });

    it('dates a legal page from the API, and leaves it undated when the API has no date', async () => {
        mockApi({
            '/content/legal/terms': { key: 'terms', locale: 'no', title: 'Vilkar', bodyMarkdown: '', updatedAt: '2026-06-01T00:00:00Z' },
        });
        const entries = await sitemap();

        expect(entries.find(e => e.url === `${COMPANY.url}/no/terms`)?.lastModified)
            .toEqual(new Date('2026-06-01T00:00:00Z'));
        expect(entries.find(e => e.url === `${COMPANY.url}/no/privacy`)?.lastModified).toBeUndefined();
    });
});
