import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { request } from '@sjolystinnovation/app-kit/api';
import AdminSettingsPage from '@/app/[locale]/(protected)/admin/settings/page';
import { DictionaryProvider } from '@/i18n/DictionaryProvider';
import { getDictionary } from '@/i18n/dictionaries';

const dict = getDictionary('no');
const update = vi.fn();
const updateBranding = vi.fn();
const saved = {
    contactRecipientEmail: 'post@pyttogpanne.no',
    companyName: 'Pytt og panne',
    companyLegalName: '',
    orgNumber: '',
    vatRegistered: false,
    streetAddress: 'Gate 1',
    postalCode: '',
    addressLocality: '',
    addressRegion: '',
    publicEmail: 'post@pyttogpanne.no',
    publicPhone: '12345678',
};

vi.mock('@/services/settingsService', () => ({
    default: { get: () => Promise.resolve(saved), update: (...args: unknown[]) => update(...args) },
}));
vi.mock('@/services/brandingService', () => ({
    default: { update: (...args: unknown[]) => updateBranding(...args) },
}));

// The Error that a service throws for the API's validation problem.
const refused = (data: object) =>
    request(
        () =>
            Promise.reject(
                Object.assign(new Error('Request failed with status code 400'), {
                    isAxiosError: true,
                    response: { status: 400, data },
                }),
            ),
        'Failed',
    ).catch((e: unknown) => e);

const refusedSettings = () =>
    refused({
        errors: { OrgNumber: ['Not a valid organisation number.'], CompanyName: ['At most 100 characters.'] },
        codes: { OrgNumber: ['invalidOrgNumber'], CompanyName: ['tooLong'] },
        limits: { CompanyName: 100 },
    });

const refusedLogo = (code: string) =>
    refused({
        errors: { Logo: ['The image must be a PNG, JPEG, WebP, GIF or ICO file of at most 2 MB.'] },
        codes: { Logo: [code] },
        limits: {},
    });

describe('the admin settings page', () => {
    beforeEach(() => {
        update.mockReset();
        updateBranding.mockReset();
    });

    it('shows the branding form in Norwegian', async () => {
        render(
            <DictionaryProvider locale="no">
                <AdminSettingsPage />
            </DictionaryProvider>,
        );

        expect(await screen.findByRole('heading', { name: 'Logo og ikon' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Lagre logo og ikon' })).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: 'Velg fil' })).toHaveLength(2);
        expect(screen.queryByText('Branding')).not.toBeInTheDocument();
    });

    it('shows the API field errors in Norwegian', async () => {
        update.mockRejectedValueOnce(await refusedSettings());
        render(
            <DictionaryProvider locale="no">
                <AdminSettingsPage />
            </DictionaryProvider>,
        );
        const org = await screen.findByLabelText(new RegExp(`^${dict.admin.orgNumber}`));

        await userEvent.click(screen.getByRole('button', { name: dict.common.save }));

        await waitFor(() => expect(org).toHaveAccessibleDescription(dict.validation.orgNumber));
        expect(screen.getByLabelText(new RegExp(`^${dict.admin.companyName}`))).toHaveAccessibleDescription('Bruk 100 eller færre tegn');
    });

    it('shows a refused logo in Norwegian', async () => {
        updateBranding.mockRejectedValueOnce(await refusedLogo('invalidImage')).mockRejectedValueOnce(await refusedLogo('imageTooLarge'));
        render(
            <DictionaryProvider locale="no">
                <AdminSettingsPage />
            </DictionaryProvider>,
        );
        const logo = await screen.findByLabelText('Logo');
        await userEvent.upload(logo, new File(['x'], 'logo.png', { type: 'image/png' }));

        await userEvent.click(screen.getByRole('button', { name: 'Lagre logo og ikon' }));
        await waitFor(() => expect(logo).toHaveAccessibleDescription('Ugyldig filformat. Last opp en bildefil.'));

        await userEvent.click(screen.getByRole('button', { name: 'Lagre logo og ikon' }));
        await waitFor(() => expect(logo).toHaveAccessibleDescription('Filen er for stor. Last opp en fil på 2 MB eller mindre.'));
        expect(screen.queryByText(/PNG, JPEG, WebP, GIF or ICO/)).not.toBeInTheDocument();
    });
});
