import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import { nbLegalPageViewStrings } from '@sjolystinnovation/app-kit/locales/nb';
import TermsPage from '@/app/[locale]/terms/page';

beforeEach(() => {
    vi.stubEnv('NEXT_PHASE', PHASE_PRODUCTION_BUILD);
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
});

describe('public pages built while the API is down', () => {
    it('builds a legal page as not written yet', async () => {
        render(await TermsPage({ params: Promise.resolve({ locale: 'no' }) }));

        expect(screen.getByText(nbLegalPageViewStrings.missing!)).toBeInTheDocument();
    });
});
