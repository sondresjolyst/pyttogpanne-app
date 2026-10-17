import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { request } from '@sjolystinnovation/app-kit/api';
import userEvent from '@testing-library/user-event';
import ResetPasswordPage from '@/app/[locale]/(auth)/reset-password/page';
import { DictionaryProvider } from '@/i18n/DictionaryProvider';
import { nbResetPasswordFlowStrings as text } from '@sjolystinnovation/app-kit/locales/nb';
import { navigation, resetTestMocks } from '@sjolystinnovation/app-kit/testing';

const resetPassword = vi.fn();

vi.mock('next/navigation', async () => (await import('@sjolystinnovation/app-kit/testing')).nextNavigationMock());
vi.mock('@/services/userService', () => ({
    default: { resetPassword: (...args: unknown[]) => resetPassword(...args), requestPasswordReset: vi.fn() },
}));

// The Error that the user service throws for an API refusal.
const refused = (status: number, data: object) =>
    request(
        () => Promise.reject(Object.assign(new Error(`Request failed with status code ${status}`), { isAxiosError: true, response: { status, data } })),
        'Failed',
    ).catch((e: unknown) => e);

const page = () => (
    <DictionaryProvider locale="no">
        <ResetPasswordPage />
    </DictionaryProvider>
);

const submitPassword = async (password: string) => {
    await userEvent.type(screen.getByLabelText(new RegExp(`^${text.newPassword}`)), password);
    await userEvent.click(screen.getByRole('button', { name: text.setPassword }));
};

describe('reset password page', () => {
    beforeEach(() => {
        resetTestMocks();
        navigation.searchParams = new URLSearchParams('email=ola@kunde.no&code=123456');
        resetPassword.mockReset().mockResolvedValue({ message: 'ok' });
    });

    it('does not send a password the API would refuse', async () => {
        render(page());

        await submitPassword('passord1');

        expect(resetPassword).not.toHaveBeenCalled();
        expect(screen.getByLabelText(new RegExp(`^${text.newPassword}`))).toHaveAccessibleDescription(text.passwordInvalid!);
    });

    it('does not count Å as an uppercase letter, as the API does not', async () => {
        render(page());

        await submitPassword('Ålesund1');

        expect(resetPassword).not.toHaveBeenCalled();
    });

    it('sends a password that meets the rules', async () => {
        render(page());

        await submitPassword('Ålesund1A');

        expect(resetPassword).toHaveBeenCalledWith({ email: 'ola@kunde.no', code: '123456', newPassword: 'Ålesund1A' });
    });

    it('shows a wrong or expired code in Norwegian', async () => {
        resetPassword.mockReset().mockRejectedValueOnce(await refused(400, { message: 'Invalid or expired reset code.', code: 'invalidResetCode' }));
        render(page());

        await submitPassword('Ålesund1A');

        expect(await screen.findByText('Koden er feil eller har gått ut. Sjekk koden i e-posten, eller be om en ny kode.')).toBeInTheDocument();
        expect(screen.queryByText('Invalid or expired reset code.')).not.toBeInTheDocument();
    });

    it('shows a password the API refuses in Norwegian under the field', async () => {
        resetPassword.mockReset().mockRejectedValueOnce(
            await refused(400, {
                errors: { NewPassword: ['Passwords must be at least 10 characters.'] },
                codes: { NewPassword: ['passwordTooShort'] },
                limits: { NewPassword: 10 },
            }),
        );
        render(page());

        await submitPassword('Ålesund1A');

        expect(await screen.findByText('Passordet er for kort. Bruk minst 10 tegn.')).toBeInTheDocument();
        expect(screen.queryByText('Passwords must be at least 10 characters.')).not.toBeInTheDocument();
    });
});
