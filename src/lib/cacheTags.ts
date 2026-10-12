import { LOCALES } from '@/i18n/config';

// Sent to POST /api/revalidate, which maps each to the ISR paths it affects.
export const REVALIDATE_TARGETS = {
    legal: 'legal',
    branding: 'branding',
} as const;

export type RevalidateTarget = (typeof REVALIDATE_TARGETS)[keyof typeof REVALIDATE_TARGETS];

const perLocale = (paths: string[]): string[] =>
    LOCALES.flatMap(locale => paths.map(path => `/${locale}${path}`));

export const TARGET_PATHS: Record<RevalidateTarget, string[]> = {
    legal: [...perLocale(['/terms', '/privacy', '/cookies']), '/sitemap.xml'],
    // Every page renders branding through the layout, and so does /icon: the tag reaches them all.
    branding: [],
};
