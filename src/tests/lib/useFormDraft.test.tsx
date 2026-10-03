import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { useFormDraft } from '@/lib/useFormDraft';

const KEY = 'pyttogpanne:draft:test-form';

function Form({ initialTitle = '' }: { initialTitle?: string }) {
    const [title, setTitle] = useState(initialTitle);
    const draft = useFormDraft('test-form', { title });

    return (
        <div>
            {draft.pending && (
                <div>
                    <span>draft waiting: {draft.pending.title}</span>
                    <button
                        onClick={() => {
                            setTitle(draft.pending!.title);
                            draft.dismiss();
                        }}
                    >
                        restore
                    </button>
                    <button onClick={() => { draft.clear(); draft.dismiss(); }}>discard</button>
                </div>
            )}
            <input aria-label="title" value={title} onChange={e => setTitle(e.target.value)} />
            <button onClick={draft.clear}>saved</button>
        </div>
    );
}

const stored = () => {
    const raw = window.localStorage.getItem(KEY);
    return raw == null ? null : JSON.parse(raw);
};

const settle = async () => {
    await act(async () => {
        vi.advanceTimersByTime(600);
    });
};

describe('useFormDraft', () => {
    beforeEach(() => {
        window.localStorage.clear();
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => vi.useRealTimers());

    it('stores what the user types so a lost session cannot lose it', async () => {
        render(<Form />);

        await userEvent.type(screen.getByLabelText('title'), 'Fiskesuppe');
        await settle();

        expect(stored()).toEqual({ title: 'Fiskesuppe' });
    });

    it('offers a stored draft instead of applying it', async () => {
        window.localStorage.setItem(KEY, JSON.stringify({ title: 'Halvferdig' }));
        render(<Form />);

        expect(await screen.findByText('draft waiting: Halvferdig')).toBeInTheDocument();
        expect(screen.getByLabelText('title')).toHaveValue('');
    });

    it('leaves an unanswered offer alone while the form sits untouched', async () => {
        window.localStorage.setItem(KEY, JSON.stringify({ title: 'Halvferdig' }));
        render(<Form />);
        await settle();

        expect(stored()).toEqual({ title: 'Halvferdig' });
    });

    it('still saves new typing while the offer is unanswered', async () => {
        // The reason the offer is held in memory rather than gating the writer: an admin who
        // ignores the banner and types a whole recipe must not end up with nothing stored.
        window.localStorage.setItem(KEY, JSON.stringify({ title: 'Halvferdig' }));
        render(<Form />);

        await userEvent.type(await screen.findByLabelText('title'), 'Noe nytt');
        await settle();

        expect(stored()).toEqual({ title: 'Noe nytt' });
        expect(screen.getByText('draft waiting: Halvferdig')).toBeInTheDocument();
    });

    it('restores the offered draft when the user asks for it', async () => {
        window.localStorage.setItem(KEY, JSON.stringify({ title: 'Halvferdig' }));
        render(<Form />);

        await userEvent.click(await screen.findByRole('button', { name: 'restore' }));
        await settle();

        expect(screen.getByLabelText('title')).toHaveValue('Halvferdig');
        expect(screen.queryByText(/draft waiting/)).not.toBeInTheDocument();
    });

    it('drops the draft when the user discards it', async () => {
        window.localStorage.setItem(KEY, JSON.stringify({ title: 'Halvferdig' }));
        render(<Form />);

        await userEvent.click(await screen.findByRole('button', { name: 'discard' }));

        expect(stored()).toBeNull();
        expect(screen.queryByText(/draft waiting/)).not.toBeInTheDocument();
    });

    it('does not write an edit form back before the user changes anything', async () => {
        render(<Form initialTitle="Fra API" />);
        await settle();

        expect(stored()).toBeNull();
    });

    it('drops the draft after a successful save', async () => {
        render(<Form />);

        await userEvent.type(screen.getByLabelText('title'), 'Fiskesuppe');
        await settle();
        await userEvent.click(screen.getByRole('button', { name: 'saved' }));

        expect(stored()).toBeNull();
    });
});
