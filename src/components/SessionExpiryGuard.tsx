"use client";

import { useEffect, useState, useSyncExternalStore } from 'react';
import { getSession, useSession } from 'next-auth/react';
import { toast } from 'sonner';
import Alert from './Alert';
import CredentialsForm from './CredentialsForm';
import { useDictionary } from '@/i18n/DictionaryProvider';
import {
    closeSessionPrompt,
    getSessionPromptOpen,
    isTerminalSessionError,
    openSessionPrompt,
    subscribeSessionPrompt,
} from '@/lib/sessionExpiry';

// The absolute session cap cannot be refreshed away, so warn while there is still time to sign
// in again without interrupting a save.
const WARN_BEFORE_MS = 30 * 60 * 1000;
const WARN_TICK_MS = 60 * 1000;

/**
 * Keeps an expiring session from costing the user their work. It warns before the absolute cap,
 * and signs them back in without leaving the page when a request finds a dead session.
 */
export default function SessionExpiryGuard() {
    const { data: session, status } = useSession();
    const { dict } = useDictionary();

    const open = useSyncExternalStore(subscribeSessionPrompt, getSessionPromptOpen, () => false);
    const [minutesLeft, setMinutesLeft] = useState<number | null>(null);

    const expired = status === 'authenticated' && isTerminalSessionError(session?.error);

    useEffect(() => {
        const at = session?.absoluteExpiresAt;
        if (status !== 'authenticated' || at == null) {
            setMinutesLeft(null);
            return;
        }
        const tick = () => {
            const remaining = at - Date.now();
            setMinutesLeft(remaining <= WARN_BEFORE_MS ? Math.max(0, Math.round(remaining / 60000)) : null);
        };
        tick();
        const timer = window.setInterval(tick, WARN_TICK_MS);
        return () => window.clearInterval(timer);
    }, [status, session?.absoluteExpiresAt]);

    const signedIn = async () => {
        // next-auth's signIn already refreshed the client session, so read it back and only
        // claim success if the new session can actually be used to save.
        const next = await getSession();
        if (!next || isTerminalSessionError(next.error)) {
            throw new Error(dict.auth.sessionNotRestored);
        }
        closeSessionPrompt();
        toast.success(dict.auth.sessionRestored);
    };

    return (
        <>
            {(expired || minutesLeft != null) && (
                // Anchored to the bottom: the navbar is sticky at the top with the same
                // stacking level.
                <div className="fixed inset-x-0 bottom-0 z-40">
                    <Alert variant="warning">
                        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2">
                            <span>
                                {expired
                                    ? dict.auth.sessionExpiredBody
                                    : dict.auth.sessionExpiringSoon.replace('{minutes}', String(minutesLeft))}
                            </span>
                            <button
                                type="button"
                                onClick={openSessionPrompt}
                                className="font-semibold underline underline-offset-2"
                            >
                                {dict.auth.reSignIn}
                            </button>
                        </div>
                    </Alert>
                </div>
            )}

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="session-expiry-title"
                        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
                    >
                        <h2 id="session-expiry-title" className="text-lg font-bold text-gray-900">
                            {dict.auth.sessionExpiredTitle}
                        </h2>
                        <p className="mt-1 mb-4 text-sm text-gray-600">{dict.auth.sessionExpiredBody}</p>
                        <CredentialsForm initialEmail={session?.user?.email ?? ''} onSignedIn={signedIn}>
                            <button
                                type="button"
                                onClick={closeSessionPrompt}
                                className="rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                {dict.common.close}
                            </button>
                        </CredentialsForm>
                    </div>
                </div>
            )}
        </>
    );
}
