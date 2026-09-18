import { describe, it, expect } from 'vitest';
import { isLocale, localeHref, switchLocalePath, toLocale, LOCALES } from '@/i18n/config';
import { allDictionaries, getDictionary } from '@/i18n/dictionaries';

describe('locale helpers', () => {
    it('recognises supported locales only', () => {
        expect(isLocale('no')).toBe(true);
        expect(isLocale('en')).toBe(false);
        expect(isLocale('nb')).toBe(false);
        expect(isLocale(undefined)).toBe(false);
    });

    it('falls back to the default locale', () => {
        expect(toLocale('de')).toBe('no');
        expect(toLocale('en')).toBe('no');
    });

    it('prefixes routes with the locale segment', () => {
        expect(localeHref('no', '/admin/recipes')).toBe('/no/admin/recipes');
        expect(localeHref('no', '/')).toBe('/no');
        expect(localeHref('no', '#contact')).toBe('#contact');
        expect(localeHref('no', 'https://example.com')).toBe('https://example.com');
    });

    it('swaps the locale segment and keeps the rest of the path', () => {
        expect(switchLocalePath('/no/admin/recipes', 'no')).toBe('/no/admin/recipes');
        expect(switchLocalePath('/', 'no')).toBe('/no');
    });
});

const keyPaths = (value: unknown, prefix = ''): string[] =>
    typeof value === 'object' && value !== null
        ? Object.entries(value).flatMap(([key, child]) => keyPaths(child, prefix ? `${prefix}.${key}` : key))
        : [prefix];

describe('dictionaries', () => {
    it('ships one for every supported locale', () => {
        expect(allDictionaries().map(([locale]) => locale)).toEqual([...LOCALES]);
    });

    it('has the same keys in every language', () => {
        const [[, reference], ...rest] = allDictionaries();
        const expected = keyPaths(reference).sort();

        for (const [locale, dictionary] of rest) {
            const actual = keyPaths(dictionary).sort();
            expect(actual.filter(k => !expected.includes(k)), `extra keys in ${locale}`).toEqual([]);
            expect(expected.filter(k => !actual.includes(k)), `missing keys in ${locale}`).toEqual([]);
        }
    });

    it('has no empty strings', () => {
        for (const [locale, dictionary] of allDictionaries()) {
            const empty = keyPaths(dictionary).filter(path => {
                const value = path.split('.').reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], dictionary);
                return typeof value === 'string' && value.trim() === '';
            });
            expect(empty, `empty values in ${locale}`).toEqual([]);
        }
    });
});

describe('getDictionary', () => {
    it('returns a dictionary for every supported locale', () => {
        for (const locale of LOCALES) {
            expect(getDictionary(locale).admin.title).toBeTruthy();
        }
    });
});
