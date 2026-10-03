"use client";

import { useCallback, useEffect, useRef, useState } from 'react';

const PREFIX = 'pyttogpanne:draft:';
const WRITE_DELAY_MS = 500;

function read<T>(key: string): T | null {
    try {
        const raw = window.localStorage.getItem(PREFIX + key);
        return raw == null ? null : (JSON.parse(raw) as T);
    } catch {
        return null;
    }
}

/**
 * Keeps a form's values in localStorage so a sign-out, reload or closed tab cannot lose them.
 *
 * A draft found at mount is offered for restore rather than applied, so an edit form never
 * silently overwrites what the API returned. Saving starts immediately either way: the offer is
 * held in memory, so the newest work is always the thing on disk.
 */
export function useFormDraft<T>(key: string, value: T) {
    const [pending, setPending] = useState<T | null>(null);
    const json = JSON.stringify(value);
    const untouched = useRef(json);

    useEffect(() => {
        setPending(read<T>(key));
    }, [key]);

    useEffect(() => {
        // Write only once the form differs from how it opened. Writing the pristine form would
        // overwrite the draft being offered before the user has answered the prompt.
        if (json === untouched.current) return;
        const timer = window.setTimeout(() => {
            try {
                window.localStorage.setItem(PREFIX + key, json);
            } catch {
                // A full or blocked store must not break the form.
            }
        }, WRITE_DELAY_MS);
        return () => window.clearTimeout(timer);
    }, [key, json]);

    const clear = useCallback(() => {
        try {
            window.localStorage.removeItem(PREFIX + key);
        } catch {
            // Ignore: the draft is a convenience, not state we depend on.
        }
    }, [key]);

    return {
        /** The draft found at mount, while it is still waiting to be restored or dismissed. */
        pending,
        /** Stop offering the draft. The caller applies the values it wants. */
        dismiss: useCallback(() => setPending(null), []),
        /** Drop the stored draft after a successful save. */
        clear,
    };
}
