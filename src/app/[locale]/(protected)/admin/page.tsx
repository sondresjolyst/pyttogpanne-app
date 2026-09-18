"use client";

import Link from 'next/link';
import { BookOpenIcon, Cog6ToothIcon, PresentationChartLineIcon, TagIcon, UsersIcon, ScaleIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { localeHref } from '@/i18n/config';

export default function AdminOverview() {
    const { locale, dict } = useDictionary();

    const cards = [
        { href: '/admin/recipes', icon: BookOpenIcon, title: dict.admin.recipes, text: dict.admin.cardRecipes },
        { href: '/admin/categories', icon: TagIcon, title: dict.admin.categories, text: dict.admin.cardCategories },
        { href: '/admin/gear', icon: WrenchScrewdriverIcon, title: dict.admin.gear, text: dict.admin.cardGear },
        { href: '/admin/legal', icon: ScaleIcon, title: dict.admin.legal, text: dict.admin.cardLegal },
        { href: '/admin/stats', icon: PresentationChartLineIcon, title: dict.admin.stats, text: dict.admin.cardStats },
        { href: '/admin/users', icon: UsersIcon, title: dict.admin.users, text: dict.admin.cardUsers },
        { href: '/admin/settings', icon: Cog6ToothIcon, title: dict.admin.settings, text: dict.admin.cardSettings },
    ];

    return (
        <div className="grid sm:grid-cols-2 gap-6">
            {cards.map(card => (
                <Link key={card.href} href={localeHref(locale, card.href)} className="rounded-2xl border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition">
                    <card.icon className="h-8 w-8 text-gray-900" />
                    <h2 className="mt-4 font-bold text-gray-900">{card.title}</h2>
                    <p className="mt-1 text-sm text-gray-600">{card.text}</p>
                </Link>
            ))}
        </div>
    );
}
