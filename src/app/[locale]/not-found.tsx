import { NotFoundState } from '@sjolystinnovation/app-kit/ui';
import { DEFAULT_LOCALE, localeHref } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';

export default function NotFound() {
    const dict = getDictionary(DEFAULT_LOCALE);

    return (
        <NotFoundState
            homeHref={localeHref(DEFAULT_LOCALE, '/')}
            strings={{ body: dict.common.notFoundBody, home: dict.common.toFrontPage }}
        />
    );
}
