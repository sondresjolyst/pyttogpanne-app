"use client";

import { LegalPagesEditor } from '@sjolystinnovation/app-kit/admin';
import { nbLegalPageKeyLabels, nbLegalPagesEditorStrings } from '@sjolystinnovation/app-kit/locales/nb';
import LegalService from '@/services/legalService';
import { LOCALES, LOCALE_LABELS } from '@/i18n/config';

export default function AdminLegalPage() {
    return (
        <LegalPagesEditor
            service={LegalService}
            keyLabels={nbLegalPageKeyLabels}
            locales={LOCALES}
            localeLabels={LOCALE_LABELS}
            strings={nbLegalPagesEditorStrings}
        />
    );
}
