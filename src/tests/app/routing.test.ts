import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import proxy from '@/proxy';
import { DEFAULT_LOCALE } from '@/i18n/config';

const request = (path: string) => new NextRequest(new URL(path, 'https://www.pyttogpanne.no'));

describe('locale redirect', () => {
    it('answers 308, so the locale-prefixed url is the one that ranks', () => {
        expect(proxy(request('/')).status).toBe(308);
    });

    it('sends an unprefixed path to the default locale, keeping the rest of it', () => {
        expect(proxy(request('/')).headers.get('location'))
            .toBe(`https://www.pyttogpanne.no/${DEFAULT_LOCALE}`);
        expect(proxy(request('/admin/recipes')).headers.get('location'))
            .toBe(`https://www.pyttogpanne.no/${DEFAULT_LOCALE}/admin/recipes`);
    });

    it('leaves an already-prefixed path alone', () => {
        expect(proxy(request('/no/admin')).headers.get('location')).toBeNull();
    });
});
