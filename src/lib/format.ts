import { type Locale } from '@/i18n/config';

const INTL_LOCALES: Record<Locale, string> = {
    no: 'nb-NO',
};

/** The BCP 47 tag dates and prices are written in for `locale`. */
export const intlLocale = (locale: Locale): string => INTL_LOCALES[locale];

export function formatPrice(amountNok: number, locale: Locale): string {
    return new Intl.NumberFormat(INTL_LOCALES[locale], {
        style: 'currency',
        currency: 'NOK',
        maximumFractionDigits: 0,
    }).format(amountNok);
}
