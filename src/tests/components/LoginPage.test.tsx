import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '@/app/[locale]/(auth)/login/page';
import { DictionaryProvider } from '@/i18n/DictionaryProvider';
import { nbCredentialsFormStrings as form, nbLoginPageStrings as login } from '@sjolystinnovation/app-kit/locales/nb';
import { auth, navigation, resetTestMocks } from '@sjolystinnovation/app-kit/testing';

vi.mock('next-auth/react', async () => (await import('@sjolystinnovation/app-kit/testing')).nextAuthMock());
vi.mock('next/navigation', async () => (await import('@sjolystinnovation/app-kit/testing')).nextNavigationMock());

beforeEach(resetTestMocks);

function renderLogin() {
    render(
        <DictionaryProvider locale="no">
            <Login />
        </DictionaryProvider>,
    );
}

async function submitWith(result: { error?: string; ok?: boolean; url?: string }) {
    auth.signIn.mockResolvedValue(result);
    renderLogin();
    await userEvent.type(screen.getByLabelText(new RegExp(`^${form.email}`)), 'a@b.no');
    await userEvent.type(screen.getByLabelText(new RegExp(`^${form.password}`)), 'pw');
    await userEvent.click(screen.getByRole('button', { name: form.signIn }));
}

describe('Login page', () => {
    it('is in Norwegian, with a link to reset the password', () => {
        renderLogin();

        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(login.title);
        expect(screen.getByRole('link', { name: login.forgotPassword })).toHaveAttribute('href', '/no/reset-password');
    });

    it('goes to admin after signing in', async () => {
        await submitWith({ ok: true, url: 'http://localhost/no/admin' });

        await vi.waitFor(() => expect(navigation.router.push).toHaveBeenCalledWith('/no/admin'));
    });

    it('says the API is unavailable when it is', async () => {
        await submitWith({ error: 'SignInUnavailable' });

        expect(await screen.findByText(form.signInUnavailable)).toBeInTheDocument();
    });

    it('says the credentials are wrong for any other failure', async () => {
        await submitWith({ error: 'InvalidCredentials' });

        expect(await screen.findByText(form.invalidCredentials)).toBeInTheDocument();
    });

    it('says in Norwegian that the sign-in is locked after too many attempts', async () => {
        await submitWith({ error: 'LockedOut' });

        expect(await screen.findByText('Du har prøvd å logge inn for mange ganger, så innloggingen er låst en stund. Prøv igjen senere.')).toBeInTheDocument();
        expect(screen.queryByText(form.invalidCredentials)).not.toBeInTheDocument();
    });
});
