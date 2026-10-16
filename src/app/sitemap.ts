import { MetadataRoute } from 'next';
import { publicGet } from '@/lib/publicApi';
import { REVALIDATE_TARGETS } from '@/lib/cacheTags';
import { LegalPage } from '@/services/legalService';
import { site } from '@/lib/seo/site';

export const revalidate = 3600;

// The legal pages are the only public routes here; everything else is behind the admin login.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    return site.legalEntries({
        updatedAt: async (key, locale) =>
            (await publicGet<LegalPage>(`/content/legal/${key}?locale=${locale}`, { tags: [REVALIDATE_TARGETS.legal] }))?.updatedAt,
    });
}
