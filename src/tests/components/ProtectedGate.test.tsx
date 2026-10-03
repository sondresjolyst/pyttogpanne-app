import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import type { Session } from 'next-auth';
import ProtectedGate from '@/app/[locale]/(protected)/ProtectedGate';
import { DictionaryProvider } from '@/i18n/DictionaryProvider';
import { closeSessionPrompt, openSessionPrompt } from '@/lib/sessionExpiry';

const push = vi.fn();
const getSession = vi.fn(async () => null);
let pathname = '/no/admin/recipes/new';
let sessionState: { data: Session | null; status: 'loading' | 'authenticated' | 'unauthenticated' };

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push }),
    usePathname: () => pathname,
}));

vi.mock('next-auth/react', () => ({
    useSession: () => sessionState,
    getSession: () => getSession(),
}));

const session = (error?: string): Session => ({
    user: { id: '1', name: 'admin', email: 'a@b.no', roles: ['Admin'] },
    accessToken: 'token',
    error,
    expires: '',
});

const gate = () => (
    <DictionaryProvider locale="no">
        <ProtectedGate>
            <p>admin work</p>
        </ProtectedGate>
    </DictionaryProvider>
);

describe('ProtectedGate', () => {
    beforeEach(() => {
        push.mockClear();
        getSession.mockClear();
        pathname = '/no/admin/recipes/new';
        sessionState = { data: null, status: 'loading' };
        closeSessionPrompt();
    });

    afterEach(() => {
        vi.useRealTimers();
        closeSessionPrompt();
    });

    it('sends a signed-out visitor to the login page', () => {
        sessionState = { data: null, status: 'unauthenticated' };
        render(gate());

        expect(push).toHaveBeenCalledWith('/no/login');
        expect(screen.queryByText('admin work')).not.toBeInTheDocument();
    });

    it('renders the protected page for a healthy session', () => {
        sessionState = { data: session(), status: 'authenticated' };
        render(gate());

        expect(screen.getByText('admin work')).toBeInTheDocument();
        expect(push).not.toHaveBeenCalled();
    });

    it('refuses to open the page on a session that is already dead', () => {
        sessionState = { data: session('RefreshTokenRejected'), status: 'authenticated' };
        render(gate());

        // Opening the form on a dead session is what let the customer type a whole recipe and
        // only then be thrown out.
        expect(screen.queryByText('admin work')).not.toBeInTheDocument();
        expect(push).toHaveBeenCalledWith('/no/login');
    });

    it('keeps the page mounted when the session dies while the user works', () => {
        sessionState = { data: session(), status: 'authenticated' };
        const view = render(gate());

        sessionState = { data: session('AbsoluteSessionExpired'), status: 'authenticated' };
        view.rerender(gate());

        expect(screen.getByText('admin work')).toBeInTheDocument();
        expect(push).not.toHaveBeenCalled();
    });

    it('keeps the page mounted while the session is being re-read', () => {
        sessionState = { data: session(), status: 'authenticated' };
        const view = render(gate());

        // next-auth reports 'loading' during a session refetch. Swapping the children for a
        // spinner here would unmount the form and destroy everything typed into it.
        sessionState = { data: session(), status: 'loading' };
        view.rerender(gate());

        expect(screen.getByText('admin work')).toBeInTheDocument();
    });

    it('checks a dead session again on the next protected page', () => {
        sessionState = { data: session(), status: 'authenticated' };
        const view = render(gate());
        sessionState = { data: session('RefreshTokenRejected'), status: 'authenticated' };
        view.rerender(gate());
        expect(push).not.toHaveBeenCalled();

        pathname = '/no/admin/gear';
        view.rerender(gate());

        // A pass earned on the previous page must not carry into a fresh form.
        expect(push).toHaveBeenCalledWith('/no/login');
        expect(screen.queryByText('admin work')).not.toBeInTheDocument();
    });

    it('does not redirect out from under the re-sign-in prompt', () => {
        sessionState = { data: null, status: 'unauthenticated' };
        act(() => openSessionPrompt());

        render(gate());

        // The prompt recovers the session in place; navigating away would unmount the form it
        // is trying to save.
        expect(push).not.toHaveBeenCalled();
    });

    it('ignores a transient refresh failure', () => {
        sessionState = { data: session('ECONNREFUSED'), status: 'authenticated' };
        render(gate());

        expect(screen.getByText('admin work')).toBeInTheDocument();
        expect(push).not.toHaveBeenCalled();
    });

    it('keeps the session fresh without putting the provider into loading', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        sessionState = { data: session(), status: 'authenticated' };
        render(gate());

        await act(async () => {
            vi.advanceTimersByTime(4 * 60 * 1000);
        });

        // getSession, not useSession().update(): update() flips the provider to 'loading',
        // which would unmount the form every four minutes.
        expect(getSession).toHaveBeenCalled();
        expect(screen.getByText('admin work')).toBeInTheDocument();
    });

    it('does not poll for a signed-out visitor', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        sessionState = { data: null, status: 'unauthenticated' };
        render(gate());

        await act(async () => {
            vi.advanceTimersByTime(10 * 60 * 1000);
        });

        expect(getSession).not.toHaveBeenCalled();
    });
});
