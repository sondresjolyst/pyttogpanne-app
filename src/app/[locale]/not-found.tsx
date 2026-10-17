import { NotFoundState } from '@sjolystinnovation/app-kit/ui';
import { nbNotFoundStateStrings } from '@sjolystinnovation/app-kit/locales/nb';
import { DEFAULT_LOCALE, localeHref } from '@/i18n/config';

export default function NotFound() {
    return <NotFoundState homeHref={localeHref(DEFAULT_LOCALE, '/')} strings={nbNotFoundStateStrings} />;
}
