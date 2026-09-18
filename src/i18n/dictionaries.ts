import { LOCALES, type Locale } from './config';
import no from './locales/no.json';

export type Dictionary = typeof no;

const DICTIONARIES = { no } satisfies Record<Locale, Dictionary>;

export function getDictionary(locale: Locale): Dictionary {
    return DICTIONARIES[locale];
}

export function allDictionaries(): [Locale, Dictionary][] {
    return LOCALES.map(locale => [locale, DICTIONARIES[locale]]);
}
