"use client";

import { ADMIN_ROLE } from '@/lib/roles';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { localeHref } from '@/i18n/config';
import { AdminShell } from '@sjolystinnovation/app-kit/admin';
import { nbAdminShellStrings } from '@sjolystinnovation/app-kit/locales/nb';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { locale, dict } = useDictionary();

    const tabs = [
        { href: localeHref(locale, '/admin'), label: dict.admin.dashboard },
        { href: localeHref(locale, '/admin/recipes'), label: dict.admin.recipes },
        { href: localeHref(locale, '/admin/categories'), label: dict.admin.categories },
        { href: localeHref(locale, '/admin/gear'), label: dict.admin.gear },
        { href: localeHref(locale, '/admin/legal'), label: dict.admin.legal },
        { href: localeHref(locale, '/admin/stats'), label: dict.admin.stats },
        { href: localeHref(locale, '/admin/users'), label: dict.admin.users },
        { href: localeHref(locale, '/admin/settings'), label: dict.admin.settings },
    ];
    // The start page redirects to admin, so a signed-in user without the role is told so here.
    const denied = (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
            <p className="text-gray-900 font-semibold">{dict.admin.noAccess}</p>
            <p className="mt-2 text-sm text-gray-500">{dict.admin.noAccessHint}</p>
        </div>
    );

    return (
        <AdminShell
            role={ADMIN_ROLE}
            title={dict.admin.title}
            strings={nbAdminShellStrings}
            tabs={tabs}
            fallback={<div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center text-gray-500">{dict.common.loading}</div>}
            denied={denied}
        >
            {children}
        </AdminShell>
    );
}
