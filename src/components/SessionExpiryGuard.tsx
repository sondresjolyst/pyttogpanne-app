"use client";

import { toast } from '@sjolystinnovation/app-kit/toast';
import { SessionExpiryGuard as Guard } from '@sjolystinnovation/app-kit/session/react';
import { nbCredentialsFormStrings, nbSessionExpiryGuardStrings } from '@sjolystinnovation/app-kit/locales/nb';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { localeHref } from '@/i18n/config';

export default function SessionExpiryGuard() {
    const { locale, dict } = useDictionary();
    return (
        <Guard
            loginHref={localeHref(locale, '/login')}
            onRestored={() => toast.success(dict.auth.sessionRestored)}
            strings={nbSessionExpiryGuardStrings}
            formStrings={nbCredentialsFormStrings}
        />
    );
}
