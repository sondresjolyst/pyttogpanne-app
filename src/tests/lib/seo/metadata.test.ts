import { describe, it, expect } from 'vitest';
import type { Metadata } from 'next';
import { pageMetadata, siteMetadata } from '@/lib/seo/metadata';
import { DEFAULT_LOCALE, LOCALES, LOCALE_TAGS } from '@/i18n/config';

/** Next types the alternates map by locale tag; tests look entries up by string key. */
const languagesOf = (meta: Metadata): Record<string, unknown> =>
    (meta.alternates?.languages ?? {}) as Record<string, unknown>;

describe('pageMetadata', () => {
    it('canonicalises to the requested locale', () => {
        expect(pageMetadata({ locale: 'no', path: '/admin' }).alternates?.canonical).toBe('/no/admin');
    });

    it('lists every locale as a language alternate', () => {
        const languages = languagesOf(pageMetadata({ locale: 'no', path: '/terms' }));
        for (const locale of LOCALES) {
            expect(languages[LOCALE_TAGS[locale]]).toBe(`/${locale}/terms`);
        }
    });

    it('points x-default at the default locale', () => {
        const languages = languagesOf(pageMetadata({ locale: 'no', path: '/admin' }));
        expect(languages['x-default']).toBe(`/${DEFAULT_LOCALE}/admin`);
    });

    it('mirrors the canonical url into Open Graph', () => {
        const meta = pageMetadata({ locale: 'no', path: '/terms', title: 'Vilkaar' });
        expect(meta.openGraph).toMatchObject({ url: '/no/terms', title: 'Vilkaar' });
    });

    it('omits optional fields rather than emitting empty ones', () => {
        const meta = pageMetadata({ locale: 'no' });
        expect(meta.title).toBeUndefined();
        expect(meta.description).toBeUndefined();
    });

    it('gives every page a share image, localised, unless it supplies its own', () => {
        const images = pageMetadata({ locale: 'no', path: '/terms' }).openGraph?.images as Array<{ url: string }>;
        expect(images[0].url).toBe('/no/og');

        const own = pageMetadata({ locale: 'no', path: '/terms', images: ['https://img.example/cover'] });
        expect(own.openGraph?.images).toEqual(['https://img.example/cover']);
    });
});

describe('siteMetadata', () => {
    it('carries the title template and index directive for every page below it', () => {
        const meta = siteMetadata('no');
        expect(meta.title).toHaveProperty('template');
        expect(meta.robots).toEqual({ index: true, follow: true });
        expect(meta.alternates?.canonical).toBe('/no');
    });
});
