import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminSettingsPage from '@/app/[locale]/(protected)/admin/settings/page';
import { DictionaryProvider } from '@/i18n/DictionaryProvider';

vi.mock('@/services/settingsService', () => ({
    default: { get: vi.fn().mockResolvedValue({}), update: vi.fn() },
}));
vi.mock('@/services/brandingService', () => ({
    default: { update: vi.fn() },
}));

describe('the admin settings page', () => {
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
});
