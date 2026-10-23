import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminCategoriesPage from '@/app/[locale]/(protected)/admin/categories/page';
import { DictionaryProvider } from '@/i18n/DictionaryProvider';
import { resetTestMocks } from '@sjolystinnovation/app-kit/testing';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }));

vi.mock('@/services/axiosInstance', () => ({ default: api }));
vi.mock('sonner', async () => (await import('@sjolystinnovation/app-kit/testing')).toastMock());

const category = { id: 7, key: 'brød', name: 'Brød', sortOrder: 10 };

const renderPage = () =>
    render(
        <DictionaryProvider locale="no">
            <AdminCategoriesPage />
        </DictionaryProvider>,
    );

describe('admin categories page', () => {
    beforeEach(() => {
        resetTestMocks();
        api.get.mockReset().mockResolvedValue({ data: [category] });
        api.delete.mockReset().mockResolvedValue({ data: null });
    });

    it('deletes nothing on Cancel and deletes once on Confirm', async () => {
        renderPage();

        await userEvent.click(await screen.findByRole('button', { name: 'Slett' }));
        await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Avbryt' }));
        expect(api.delete).not.toHaveBeenCalled();
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

        await userEvent.click(screen.getByRole('button', { name: 'Slett' }));
        await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Slett' }));

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(api.delete).toHaveBeenCalledTimes(1);
        expect(api.delete).toHaveBeenCalledWith('/recipe-categories/7');
    });
});
