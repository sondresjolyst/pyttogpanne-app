import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminStatsPage from '@/app/[locale]/(protected)/admin/stats/page';
import { DictionaryProvider } from '@/i18n/DictionaryProvider';
import { resetTestMocks } from '@sjolystinnovation/app-kit/testing';

const api = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('@/services/axiosInstance', () => ({ default: api }));
vi.mock('sonner', async () => (await import('@sjolystinnovation/app-kit/testing')).toastMock());

const stats = {
    totalUsers: 2,
    publishedRecipes: 3,
    draftRecipes: 1,
    recipeCategories: 4,
    gearItemCount: 5,
    contentImages: 6,
    storageUsedBytes: 1536,
    diskTotalBytes: 10 * 1024 ** 3,
    diskFreeBytes: 4 * 1024 ** 3,
};
const email = { days: 30, requests: 42, delivered: 40, hardBounces: 1, softBounces: 2, spamReports: 3, blocked: 4, invalid: 0 };

const renderPage = () =>
    render(
        <DictionaryProvider locale="no">
            <AdminStatsPage />
        </DictionaryProvider>,
    );

describe('admin stats page', () => {
    beforeEach(() => {
        resetTestMocks();
        api.get.mockReset().mockImplementation((url: string) => {
            if (url === '/admin/stats') return Promise.resolve({ data: stats });
            if (url === '/admin/stats/history') return Promise.resolve({ data: [] });
            if (url === '/admin/email-stats') return Promise.resolve({ data: email });
            return Promise.reject(new Error(`unexpected ${url}`));
        });
    });

    it('shows the email stats from the AppKit endpoint in Norwegian', async () => {
        renderPage();

        expect(await screen.findByRole('heading', { name: 'E-post (siste 30 dager)' })).toBeInTheDocument();
        expect(await screen.findByText('42')).toBeInTheDocument();
        expect(screen.getByText('Returnert').nextSibling).toHaveTextContent('3');
        expect(screen.getByText('Blokkert eller spam').nextSibling).toHaveTextContent('7');
        expect(api.get).toHaveBeenCalledWith('/admin/email-stats', { params: { days: 30 } });
    });

    it('says the email stats are unavailable when Brevo cannot be read', async () => {
        api.get.mockImplementation((url: string) =>
            url === '/admin/email-stats'
                ? Promise.reject(Object.assign(new Error('Request failed with status code 502'), { isAxiosError: true, response: { status: 502, data: {} } }))
                : Promise.resolve({ data: url === '/admin/stats' ? stats : [] }),
        );
        renderPage();

        expect(await screen.findByText('E-poststatistikken er ikke tilgjengelig akkurat nå. Prøv igjen senere.')).toBeInTheDocument();
    });

    it('shows the storage numbers from the stats endpoint', async () => {
        renderPage();

        expect(await screen.findByText('1.5 KB')).toBeInTheDocument();
        expect(screen.getByText('4.0 GB')).toBeInTheDocument();
        expect(screen.getByText('10.0 GB')).toBeInTheDocument();
    });
});
