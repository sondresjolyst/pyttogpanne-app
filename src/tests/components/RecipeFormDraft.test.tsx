import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecipeForm from '@/app/[locale]/(protected)/admin/recipes/RecipeForm';
import { DictionaryProvider } from '@/i18n/DictionaryProvider';
import { getDictionary } from '@/i18n/dictionaries';

const dict = getDictionary('no');
const USER_ID = 'user-1';
const KEY = `pyttogpanne:draft:${USER_ID}:recipe:new`;

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

let sessionState: { data: unknown; status: string } = {
    data: { user: { id: USER_ID, name: 'admin', email: 'a@b.no', roles: ['Admin'] }, accessToken: 't', expires: '' },
    status: 'authenticated',
};

vi.mock('next-auth/react', () => ({
    useSession: () => sessionState,
}));

const authenticated = () => ({
    data: { user: { id: USER_ID, name: 'admin', email: 'a@b.no', roles: ['Admin'] }, accessToken: 't', expires: '' },
    status: 'authenticated',
});

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const create = vi.fn(async (_body: unknown) => ({ id: 1 }));

vi.mock('@/services/recipeService', async importOriginal => {
    const actual = await importOriginal<typeof import('@/services/recipeService')>();
    return { ...actual, default: { ...actual.default, create: (body: unknown) => create(body) } };
});

vi.mock('@/services/recipeCategoryService', () => ({
    default: { list: async () => [] },
}));

const draft = {
    title: 'Fiskesuppe med torsk',
    intro: 'En rask suppe til hyttekvelden.',
    servings: 4,
    prepMinutes: '15',
    cookMinutes: '25',
    difficulty: 'Enkel',
    tips: '',
    images: [],
    isPublished: false,
    isAdvertising: false,
    advertiser: '',
    categoryIds: [],
    ingredients: [{ groupName: '', amount: '400', unit: 'g', name: 'torskefilet', note: '' }],
    steps: [{ text: 'Skjær fisken i terninger.', contentImageId: null }],
};

// Selected by position, which also keeps the test independent of the label wording.
const titleInput = () => screen.getAllByRole('textbox')[0];

const form = () => (
    <DictionaryProvider locale="no">
        <RecipeForm />
    </DictionaryProvider>
);

describe('the recipe form draft bar', () => {
    beforeEach(() => {
        window.localStorage.clear();
        sessionState = authenticated();
    });

    it('stays out of the way when there is no draft', async () => {
        render(form());

        expect(await screen.findByText(dict.admin.recipeTitle)).toBeInTheDocument();
        expect(screen.queryByText(dict.admin.draftFound)).not.toBeInTheDocument();
    });

    it('offers an unsaved draft without applying it', async () => {
        window.localStorage.setItem(KEY, JSON.stringify({ savedAt: Date.now(), value: draft }));
        render(form());

        expect(await screen.findByText(dict.admin.draftFound)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: dict.admin.restoreDraft })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: dict.admin.discardDraft })).toBeInTheDocument();
        // Offered, not applied: the form behind it is still empty.
        expect(titleInput()).toHaveValue('');
    });

    it('fills the form in from the draft when the user restores it', async () => {
        window.localStorage.setItem(KEY, JSON.stringify({ savedAt: Date.now(), value: draft }));
        render(form());

        await userEvent.click(await screen.findByRole('button', { name: dict.admin.restoreDraft }));

        expect(titleInput()).toHaveValue('Fiskesuppe med torsk');
        expect(screen.getByDisplayValue('torskefilet')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Skjær fisken i terninger.')).toBeInTheDocument();
        expect(screen.queryByText(dict.admin.draftFound)).not.toBeInTheDocument();
    });

    it('throws the draft away when the user discards it', async () => {
        window.localStorage.setItem(KEY, JSON.stringify({ savedAt: Date.now(), value: draft }));
        render(form());

        await userEvent.click(await screen.findByRole('button', { name: dict.admin.discardDraft }));

        expect(window.localStorage.getItem(KEY)).toBeNull();
        expect(titleInput()).toHaveValue('');
    });

    it('does not offer a draft stored for a different recipe', async () => {
        window.localStorage.setItem(
            `pyttogpanne:draft:${USER_ID}:recipe:42`,
            JSON.stringify({ savedAt: Date.now(), value: draft }),
        );
        render(form());

        expect(await screen.findByText(dict.admin.recipeTitle)).toBeInTheDocument();
        expect(screen.queryByText(dict.admin.draftFound)).not.toBeInTheDocument();
    });

    it('keeps saving when the session cookie disappears mid-edit', async () => {
        const view = render(form());
        await userEvent.type(titleInput(), 'Fiskesuppe');

        // The cookie is gone, so useSession reports nobody on the form already on screen. This
        // is the incident the draft exists for, and the worst possible moment to stop storing.
        sessionState = { data: null, status: 'unauthenticated' };
        view.rerender(form());
        await userEvent.type(titleInput(), ' med torsk');

        await vi.waitFor(() => expect(window.localStorage.getItem(KEY)).not.toBeNull());
        expect(JSON.parse(window.localStorage.getItem(KEY)!).value.title).toBe('Fiskesuppe med torsk');
    });

    it('stores nothing on a form opened with no session at all', async () => {
        sessionState = { data: null, status: 'unauthenticated' };
        render(form());

        await userEvent.type(titleInput(), 'Fiskesuppe');
        await new Promise(resolve => setTimeout(resolve, 700));

        // No owner was ever known here, so there is no key that could not belong to someone else.
        expect(window.localStorage.length).toBe(0);
    });

    it('keeps a field the stored draft predates', async () => {
        // Drafts are kept for a week, so one can easily predate a newly added field. Asserting
        // on the rendered input would prove nothing: an undefined value makes React treat it as
        // uncontrolled and the old text stays on screen. What matters is what gets saved.
        const { servings: _dropped, ...older } = draft;
        window.localStorage.setItem(KEY, JSON.stringify({ savedAt: Date.now(), value: older }));
        render(form());

        await userEvent.click(await screen.findByRole('button', { name: dict.admin.restoreDraft }));
        await userEvent.click(screen.getByRole('button', { name: dict.common.save }));

        expect(create).toHaveBeenCalledWith(expect.objectContaining({ servings: 2 }));
    });
});
