import { describe, it, expect } from 'vitest';
import { absoluteLocaleUrl, absoluteUrl, localePath, normalizePath } from '@/lib/seo/urls';
import { COMPANY } from '@/lib/company';

describe('seo url helpers', () => {
    it('normalises a path to a leading, non-trailing slash', () => {
        expect(normalizePath('')).toBe('');
        expect(normalizePath('/')).toBe('');
        expect(normalizePath('builds')).toBe('/builds');
        expect(normalizePath('/admin/')).toBe('/admin');
    });

    it('prefixes the locale segment', () => {
        expect(localePath('no')).toBe('/no');
        expect(localePath('no', '/admin/recipes')).toBe('/no/admin/recipes');
    });

    it('builds absolute urls without a trailing slash', () => {
        expect(absoluteUrl()).toBe(COMPANY.url);
        expect(absoluteUrl('/sitemap.xml')).toBe(`${COMPANY.url}/sitemap.xml`);
        expect(absoluteLocaleUrl('no', '/contact')).toBe(`${COMPANY.url}/no/contact`);
    });
});
