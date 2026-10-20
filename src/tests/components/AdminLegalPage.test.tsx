import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { request } from '@sjolystinnovation/app-kit/api';
import AdminLegalPage from '@/app/[locale]/(protected)/admin/legal/page';
import { DictionaryProvider } from '@/i18n/DictionaryProvider';
import { getDictionary } from '@/i18n/dictionaries';

const dict = getDictionary('no');
const save = vi.fn();
const listRevisions = vi.fn();

vi.mock('@/services/legalService', () => ({
    default: {
        keys: ['terms', 'privacy'],
        listAll: () => Promise.resolve([{ key: 'terms', locale: 'no', title: 'Vilkår', bodyMarkdown: '# Vilkår', updatedAt: '2026-10-01' }]),
        save: (...args: unknown[]) => save(...args),
        listRevisions: (...args: unknown[]) => listRevisions(...args),
    },
}));

// The Error that the legal service throws for the API's validation problem.
const refused = () =>
    request(
        () =>
            Promise.reject(
                Object.assign(new Error('Request failed with status code 400'), {
                    isAxiosError: true,
                    response: {
                        status: 400,
                        data: {
                            errors: { Title: ['At most 200 characters.'] },
                            codes: { Title: ['tooLong'] },
                            limits: { Title: 200 },
                        },
                    },
                }),
            ),
        'Failed',
    ).catch((e: unknown) => e);

const renderPage = () =>
    render(
        <DictionaryProvider locale="no">
            <AdminLegalPage />
        </DictionaryProvider>,
    );

describe('admin legal page', () => {
    beforeEach(() => {
        save.mockReset();
        listRevisions.mockReset().mockResolvedValue([]);
    });

    it('shows a tab for each of the service keys', async () => {
        renderPage();

        expect(await screen.findByRole('button', { name: 'Vilkår' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Personvern' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Informasjonskapsler' })).not.toBeInTheDocument();
    });

    it('shows a too long title in Norwegian with the limit', async () => {
        save.mockRejectedValueOnce(await refused());
        renderPage();
        const title = await screen.findByLabelText(new RegExp(`^${dict.admin.recipeTitle}`));

        await userEvent.click(screen.getByRole('button', { name: dict.common.save }));

        await waitFor(() => expect(title).toHaveAccessibleDescription('Bruk 200 eller færre tegn.'));
        expect(screen.queryByText('At most 200 characters.')).not.toBeInTheDocument();
    });

    it('marks a blank content field in Norwegian without calling the API', async () => {
        renderPage();
        const body = await screen.findByLabelText('Innhold (Markdown)');
        await userEvent.clear(body);

        await userEvent.click(screen.getByRole('button', { name: dict.common.save }));

        expect(body).toHaveAccessibleDescription('Du må fylle ut dette feltet.');
        expect(save).not.toHaveBeenCalled();
    });

    it('lists the saved versions of the open page with Norwegian dates', async () => {
        listRevisions.mockResolvedValue([
            { id: 2, savedAt: '2026-10-17T12:00:00Z', title: 'Vilkår' },
            { id: 1, savedAt: '2026-10-16T12:00:00Z', title: 'Vilkår' },
        ]);
        renderPage();

        const versions = await screen.findAllByRole('button', { pressed: false, name: /okt\. 2026/ });
        expect(versions).toHaveLength(2);
        expect(versions[0]).toHaveTextContent(/17\. okt\. 2026/);
        expect(versions[1]).toHaveTextContent(/16\. okt\. 2026/);
        expect(listRevisions).toHaveBeenCalledWith('terms', 'no');
    });
});
