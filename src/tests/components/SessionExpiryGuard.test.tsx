import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Session } from 'next-auth';
import SessionExpiryGuard from '@/components/SessionExpiryGuard';
import { DictionaryProvider } from '@/i18n/DictionaryProvider';
import { getDictionary } from '@/i18n/dictionaries';
import { closeSessionPrompt, getSessionPromptOpen, openSessionPrompt } from '@/lib/sessionExpiry';

const dict = getDictionary('no');

const signIn = vi.fn();
const getSession = vi.fn();
const success = vi.fn();
let sessionState: { data: Session | null; status: 'loading' | 'authenticated' | 'unauthenticated' };

vi.mock('next-auth/react', () => ({
    useSession: () => sessionState,
    signIn: (...args: unknown[]) => signIn(...args),
    getSession: () => getSession(),
}));

vi.mock('sonner', () => ({
    toast: { success: (message: string) => success(message), error: vi.fn() },
}));

const session = (overrides: Partial<Session> = {}): Session => ({
    user: { id: '1', name: 'admin', email: 'a@b.no', roles: ['Admin'] },
    accessToken: 'token',
    expires: '',
    ...overrides,
});

const guard = () => (
    <DictionaryProvider locale="no">
        <SessionExpiryGuard />
    </DictionaryProvider>
);

const signInWith = async (password: string) => {
    await userEvent.type(screen.getByLabelText(dict.auth.password), password);
    await userEvent.click(screen.getByRole('button', { name: dict.auth.signIn }));
};

describe('SessionExpiryGuard', () => {
    beforeEach(() => {
        signIn.mockReset();
        getSession.mockReset();
        success.mockReset();
        sessionState = { data: session(), status: 'authenticated' };
        closeSessionPrompt();
    });

    afterEach(() => closeSessionPrompt());

    it('shows nothing while the session is healthy and nothing has failed', () => {
        render(guard());

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(screen.queryByText(dict.auth.sessionExpiredBody)).not.toBeInTheDocument();
    });

    it('opens the prompt when a request finds a dead session', () => {
        render(guard());

        act(() => openSessionPrompt());

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByLabelText(dict.auth.email, { exact: false })).toHaveValue('a@b.no');
    });

    it('signs in without navigating away from the form', async () => {
        signIn.mockResolvedValue({ error: null });
        getSession.mockResolvedValue(session());
        render(guard());
        act(() => openSessionPrompt());

        await signInWith('Password1');

        // redirect: false is the whole point. A redirecting sign-in would unmount the form and
        // reintroduce the bug this component exists to kill.
        expect(signIn).toHaveBeenCalledWith('credentials', expect.objectContaining({ redirect: false }));
        expect(getSessionPromptOpen()).toBe(false);
        expect(success).toHaveBeenCalledWith(dict.auth.sessionRestored);
    });

    it('keeps the prompt open when the password is wrong', async () => {
        signIn.mockResolvedValue({ error: 'CredentialsSignin' });
        render(guard());
        act(() => openSessionPrompt());

        await signInWith('wrong');

        // A typo must not cost the user their work either.
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(dict.auth.invalidCredentials)).toBeInTheDocument();
        expect(success).not.toHaveBeenCalled();
    });

    it('does not claim success when the new session still cannot save', async () => {
        signIn.mockResolvedValue({ error: null });
        getSession.mockResolvedValue(session({ error: 'RefreshTokenRejected' }));
        render(guard());
        act(() => openSessionPrompt());

        await signInWith('Password1');

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(dict.auth.sessionNotRestored)).toBeInTheDocument();
        expect(success).not.toHaveBeenCalled();
    });

    it('warns before the absolute cap, with the minutes left', () => {
        sessionState = { data: session({ absoluteExpiresAt: Date.now() + 12 * 60 * 1000 }), status: 'authenticated' };

        render(guard());

        expect(screen.getByText(dict.auth.sessionExpiringSoon.replace('{minutes}', '12'))).toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('does not warn while the cap is still far away', () => {
        sessionState = { data: session({ absoluteExpiresAt: Date.now() + 6 * 60 * 60 * 1000 }), status: 'authenticated' };

        render(guard());

        expect(screen.queryByText(/{minutes}/)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: dict.auth.reSignIn })).not.toBeInTheDocument();
    });

    it('offers the prompt from the banner once the session is dead', async () => {
        sessionState = { data: session({ error: 'AbsoluteSessionExpired' }), status: 'authenticated' };
        render(guard());

        expect(screen.getByText(dict.auth.sessionExpiredBody)).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: dict.auth.reSignIn }));

        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
});
