import { LOCALES } from '@/i18n/config';

// Sent to POST /api/revalidate, which maps each to the ISR paths it affects.
export const REVALIDATE_TARGETS = {
    legal: 'legal',
} as const;

export type RevalidateTarget = (typeof REVALIDATE_TARGETS)[keyof typeof REVALIDATE_TARGETS];

const perLocale = (paths: string[]): string[] =>
    LOCALES.flatMap(locale => paths.map(path => `/${locale}${path}`));

export const TARGET_PATHS: Record<RevalidateTarget, string[]> = {
    legal: [...perLocale(['/terms', '/privacy', '/cookies']), '/sitemap.xml'],
};
