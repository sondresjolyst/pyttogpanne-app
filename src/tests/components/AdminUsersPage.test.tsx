import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminUsersPage from '@/app/[locale]/(protected)/admin/users/page';
import { DictionaryProvider } from '@/i18n/DictionaryProvider';
import { resetTestMocks, toastSpies } from '@sjolystinnovation/app-kit/testing';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), delete: vi.fn() }));

vi.mock('@/services/axiosInstance', () => ({ default: api }));
vi.mock('sonner', async () => (await import('@sjolystinnovation/app-kit/testing')).toastMock());

const ada = { id: 'u1', email: 'ada@pyttogpanne.no', firstName: 'Ada', lastName: 'Admin', roles: ['Admin'], isDeleted: false };

// An axios refusal with the body the AppKit user admin endpoints send.
const refusal = (status: number, data: object) =>
    Object.assign(new Error(`Request failed with status code ${status}`), { isAxiosError: true, response: { status, data } });

const renderPage = () =>
    render(
        <DictionaryProvider locale="no">
            <AdminUsersPage />
        </DictionaryProvider>,
    );

const fillInvite = async () => {
    await userEvent.type(screen.getByLabelText(/^Fornavn/), 'Ola');
    await userEvent.type(screen.getByLabelText(/^Etternavn/), 'Nordmann');
    await userEvent.type(screen.getByLabelText(/^E-post/), 'ola@pyttogpanne.no');
};

describe('admin users page', () => {
    beforeEach(() => {
        resetTestMocks();
        api.get.mockReset().mockImplementation((url: string) =>
            Promise.resolve({ data: url === '/users/roles' ? ['Default', 'Admin'] : [ada] }),
        );
        api.post.mockReset();
        api.delete.mockReset();
    });

    it('loads the roles from the user admin roles route', async () => {
        renderPage();

        expect(await screen.findByRole('option', { name: 'Default' })).toBeInTheDocument();
        expect(api.get).toHaveBeenCalledWith('/users/roles');
        expect(api.get).not.toHaveBeenCalledWith('/admin/roles');
    });

    it('shows a taken email in Norwegian under the email field', async () => {
        api.post.mockRejectedValueOnce(
            refusal(400, {
                errors: { Email: ["Username 'ola@pyttogpanne.no' is already taken."] },
                codes: { Email: ['emailTaken'] },
                limits: {},
            }),
        );
        renderPage();
        await screen.findByRole('option', { name: 'Admin' });
        await fillInvite();

        await userEvent.click(screen.getByRole('button', { name: 'Send invitasjon' }));

        const text = 'E-postadressen har allerede en konto. Bruk en annen e-postadresse.';
        await waitFor(() => expect(screen.getByLabelText(/^E-post/)).toHaveAccessibleDescription(text));
        expect(toastSpies.error).toHaveBeenCalledWith(text);
    });

    it('shows a refused invite in Norwegian', async () => {
        api.post.mockRejectedValueOnce(refusal(409, { message: 'That email already has an account.', code: 'emailTaken' }));
        renderPage();
        await screen.findByRole('option', { name: 'Admin' });
        await fillInvite();

        await userEvent.click(screen.getByRole('button', { name: 'Send invitasjon' }));

        await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith('E-postadressen har allerede en konto. Bruk en annen e-postadresse.'));
    });

    it('says in Norwegian why the last admin cannot be deleted', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        api.delete.mockRejectedValueOnce(
            refusal(409, { message: 'The last admin account cannot be deleted. Give someone else the admin role first.', code: 'lastAdmin' }),
        );
        renderPage();

        await userEvent.click(await screen.findByRole('button', { name: 'Slett' }));

        await waitFor(() =>
            expect(toastSpies.error).toHaveBeenCalledWith('Den siste administratoren kan ikke slettes. Gi administratorrollen til noen andre først.'),
        );
        expect(api.delete).toHaveBeenCalledWith('/users/u1/account');
    });
});
