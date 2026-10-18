import { describe, it, expect, vi } from 'vitest';
import LegalService from '@/services/legalService';

const api = vi.hoisted(() => ({ put: vi.fn() }));
const revalidate = vi.hoisted(() => vi.fn());

vi.mock('@/services/axiosInstance', () => ({ default: api }));
vi.mock('@/services/publicClient', () => ({ default: { get: vi.fn() } }));
vi.mock('@/lib/cacheTags', () => ({ REVALIDATE_TARGETS: { legal: 'legal' }, revalidateTarget: revalidate }));

describe('legal service', () => {
    it('has the terms, privacy and cookies pages', () => {
        expect(LegalService.keys).toEqual(['terms', 'privacy', 'cookies']);
    });

    it('clears the legal pages after a save', async () => {
        api.put.mockResolvedValueOnce({ data: { key: 'terms', locale: 'no', title: 'Vilkår', bodyMarkdown: '', updatedAt: '' } });

        await LegalService.save({ key: 'terms', locale: 'no', title: 'Vilkår', bodyMarkdown: '# Vilkår' });

        expect(api.put).toHaveBeenCalledWith('/content/legal/terms/no', { title: 'Vilkår', bodyMarkdown: '# Vilkår' });
        expect(revalidate).toHaveBeenCalledWith('legal');
    });
});
