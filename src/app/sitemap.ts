import { MetadataRoute } from 'next';
import { publicGet } from '@/lib/publicApi';
import { REVALIDATE_TARGETS } from '@/lib/cacheTags';
import { LegalPage } from '@/services/legalService';
import { LOCALES, type Locale } from '@/i18n/config';
import { localeEntries, parseTimestamp } from '@/lib/seo/sitemap';

export const revalidate = 3600;

const LEGAL_KEYS = ['terms', 'privacy', 'cookies'] as const;

type ByLocale<T> = Partial<Record<Locale, T>>;

async function forEachLocale<T>(load: (locale: Locale) => Promise<T>): Promise<ByLocale<T>> {
    const loaded = await Promise.all(LOCALES.map(async locale => [locale, await load(locale)] as const));
    return Object.fromEntries(loaded) as ByLocale<T>;
}

// The legal pages are the only public routes here; everything else is behind the admin login.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const legal = await forEachLocale(async locale =>
        Object.fromEntries(await Promise.all(LEGAL_KEYS.map(async key => [
            key,
            parseTimestamp((await publicGet<LegalPage>(`/content/legal/${key}?locale=${locale}`, { tags: [REVALIDATE_TARGETS.legal] }))?.updatedAt),
        ] as const))) as Partial<Record<typeof LEGAL_KEYS[number], Date>>);

    return LEGAL_KEYS.flatMap(key => localeEntries(`/${key}`, {
        lastModified: locale => legal[locale]?.[key],
    }));
}
