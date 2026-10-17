"use client";

import { CompanySettingsForm } from '@sjolystinnovation/app-kit/admin';
import { BrandingManager } from '@sjolystinnovation/app-kit/branding';
import { nbBrandingManagerStrings, nbCompanySettingsFormStrings } from '@sjolystinnovation/app-kit/locales/nb';
import SettingsService from '@/services/settingsService';
import BrandingService from '@/services/brandingService';
import { useDictionary } from '@/i18n/DictionaryProvider';

export default function AdminSettingsPage() {
    const { dict } = useDictionary();

    return (
        <CompanySettingsForm
            service={SettingsService}
            strings={{
                ...nbCompanySettingsFormStrings,
                contactRecipientHint: dict.admin.contactRecipientHint,
                legalNameHint: dict.admin.legalNameHint,
            }}
        >
            <BrandingManager save={BrandingService.update} strings={nbBrandingManagerStrings} />
        </CompanySettingsForm>
    );
}
