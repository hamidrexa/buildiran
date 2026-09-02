/**
 * BuildIran — i18n Helper
 * Thin wrapper around translations. Add more locales here when needed.
 */

import fa from './fa';

// Currently only Persian. Extend later.
const translations = { fa };
type Locale = keyof typeof translations;

let currentLocale: Locale = 'fa';

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function t(): typeof fa {
  return translations[currentLocale];
}

/** Convenience shorthand — usage: t().map.title */
export default t;
