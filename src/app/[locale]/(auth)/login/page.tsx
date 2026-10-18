"use client";

import { LoginPage } from '@sjolystinnovation/app-kit/session/react';
import { nbCredentialsFormStrings, nbLoginPageStrings } from '@sjolystinnovation/app-kit/locales/nb';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { localeHref } from '@/i18n/config';

export default function Login() {
    const { locale } = useDictionary();

    return (
        <LoginPage
            redirectTo={localeHref(locale, '/admin')}
            resetHref={localeHref(locale, '/reset-password')}
            strings={nbLoginPageStrings}
            formStrings={nbCredentialsFormStrings}
        />
    );
}
