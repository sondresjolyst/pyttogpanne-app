import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import type { Session } from 'next-auth';
import ProtectedGate from '@/app/[locale]/(protected)/ProtectedGate';
import AdminLayout from '@/app/[locale]/(protected)/admin/layout';
import { DictionaryProvider } from '@/i18n/DictionaryProvider';
import { closeSessionPrompt, openSessionPrompt } from '@sjolystinnovation/app-kit/session';
import { makeSession, navigation, resetTestMocks, setSession } from '@sjolystinnovation/app-kit/testing';

vi.mock('next/navigation', async () => (await import('@sjolystinnovation/app-kit/testing')).nextNavigationMock());
vi.mock('next-auth/react', async () => (await import('@sjolystinnovation/app-kit/testing')).nextAuthMock());

const { push, replace } = navigation.router;

// The real nesting: the gate wraps the admin layout, which wraps the form. Testing the gate on
// its own hid the fact that the layout below it made its own decision to blank the page.
const tree = () => (
    <DictionaryProvider locale="no">
        <ProtectedGate>
            <AdminLayout>
                <p>admin work</p>
            </AdminLayout>
        </ProtectedGate>
    </DictionaryProvider>
);

describe('the admin layout inside the gate', () => {
    beforeEach(() => {
        resetTestMocks();
        navigation.pathname = '/no/admin/recipes/new';
        setSession(makeSession());
        closeSessionPrompt();
    });

    afterEach(() => closeSessionPrompt());

    it('renders the admin page for a healthy admin session', () => {
        render(tree());

        expect(screen.getByText('admin work')).toBeInTheDocument();
    });

    it('keeps the form on screen while the prompt recovers a signed-out session', () => {
        const view = render(tree());
        expect(screen.getByText('admin work')).toBeInTheDocument();

        // The cookie is gone and the 401 handler has raised the prompt. The gate declines to
        // redirect, so the layout must not blank the page either, or the form is lost anyway.
        setSession(null);
        act(() => openSessionPrompt());
        view.rerender(tree());

        expect(screen.getByText('admin work')).toBeInTheDocument();
        expect(push).not.toHaveBeenCalled();
        expect(replace).not.toHaveBeenCalled();
    });

    it('tells a signed-in user without the admin role that they have no access', () => {
        setSession(makeSession({ roles: [] }));
        render(tree());

        // The start page redirects to admin, so a redirect there would come straight back.
        expect(screen.queryByText('admin work')).not.toBeInTheDocument();
        expect(screen.getByText('Du har ikke tilgang til adminsiden.')).toBeInTheDocument();
        expect(push).not.toHaveBeenCalled();
        expect(replace).not.toHaveBeenCalled();
    });

    it('keeps a non-admin out of the admin page while the prompt is open', () => {
        setSession(makeSession({ roles: [] }));
        const view = render(tree());

        // The prompt being open must not let a known non-admin through.
        act(() => openSessionPrompt());
        view.rerender(tree());

        expect(screen.queryByText('admin work')).not.toBeInTheDocument();
        expect(screen.getByText('Du har ikke tilgang til adminsiden.')).toBeInTheDocument();
    });

    it('does not carry an admin pass over to a session that has no admin role', () => {
        const view = render(tree());
        expect(screen.getByText('admin work')).toBeInTheDocument();

        // Another account signed in through the prompt, or the role was taken away. The session
        // now has a user without the role, so the page the admin opened must not stay up.
        setSession(makeSession({ roles: [] }));
        act(() => openSessionPrompt());
        view.rerender(tree());

        expect(screen.queryByText('admin work')).not.toBeInTheDocument();
        expect(screen.getByText('Du har ikke tilgang til adminsiden.')).toBeInTheDocument();

        // The pass stays cleared after that session is lost too.
        setSession(null);
        view.rerender(tree());

        expect(screen.queryByText('admin work')).not.toBeInTheDocument();
    });

    it('keeps out a non-admin whose session is lost while the prompt is open', () => {
        setSession(makeSession({ roles: [] }));
        const view = render(tree());

        // No user on the session, so the roles are unknown. This user never had the role here.
        setSession(null);
        act(() => openSessionPrompt());
        view.rerender(tree());

        expect(screen.queryByText('admin work')).not.toBeInTheDocument();
    });

    it('does not let an admin pass on one page carry over to the next', () => {
        const view = render(tree());
        expect(screen.getByText('admin work')).toBeInTheDocument();

        // On the next page the session still works but carries no user, so the role is never seen
        // there. The session gate passes this page. The admin pass from the first page must not.
        navigation.pathname = '/no/admin/users';
        setSession({ accessToken: 'token', expires: '' } as Session);
        view.rerender(tree());
        act(() => openSessionPrompt());
        view.rerender(tree());

        expect(screen.queryByText('admin work')).not.toBeInTheDocument();
    });
});
