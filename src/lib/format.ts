import { type Locale } from '@/i18n/config';

const INTL_LOCALES: Record<Locale, string> = {
    no: 'nb-NO',
};

/** The BCP 47 tag dates are written in for `locale`. */
export const intlLocale = (locale: Locale): string => INTL_LOCALES[locale];
