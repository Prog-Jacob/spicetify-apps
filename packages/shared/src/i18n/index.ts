import type { MessageValue, PluralEntry, TranslationDict } from './types';

const getLocale = (): string => {
  try {
    return Spicetify.Locale.getLocale() ?? 'en';
  } catch {
    return 'en';
  }
};

const interpolate = (
  template: string,
  params: Record<string, string | number>,
  nf: Intl.NumberFormat,
): string =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const val = params[key] ?? `{${key}}`;
    return typeof val === 'number' ? nf.format(val) : val;
  });

/** Resolve a plural entry using ICU `#` convention (replaced with the count). */
const resolvePlural = (
  entry: PluralEntry,
  count: number,
  pluralRules: Intl.PluralRules,
  nf: Intl.NumberFormat,
): string => {
  const template = entry[pluralRules.select(count)] ?? entry.other;
  return template.replace(/#/g, nf.format(count));
};

/**
 * Create a typed translator function for a set of locale dictionaries.
 * Locale and plural rules are resolved once at creation time — Spotify
 * requires a restart to change language, so there's no need to re-read.
 *
 * Usage:
 * ```ts
 * import en from './en';
 * const t = createTranslator({ en });
 * t('export.title');
 * t('export.count', { selected: 3, total: 5 });
 * t('conflict.exists', { count: 2 });
 * ```
 */
export const createTranslator = <T extends TranslationDict>(locales: Record<string, T>) => {
  type Key = keyof T & string;

  const locale = getLocale();
  const pluralRules = new Intl.PluralRules(locale);
  const numberFormat = new Intl.NumberFormat(locale);
  const fallback = locales.en ?? Object.values(locales)[0];
  const resolvedLocale = locale in locales ? locale : locale.split('-')[0];
  const dict = resolvedLocale in locales ? { ...fallback, ...locales[resolvedLocale] } : fallback;

  const translate = (key: Key, params?: Record<string, string | number>): string => {
    const value: MessageValue | undefined = dict[key];

    if (value === undefined) return key;
    if (typeof value === 'string') {
      return params ? interpolate(value, params, numberFormat) : value;
    }

    const count = Number(params?.count) || 0;
    const resolved = resolvePlural(value, count, pluralRules, numberFormat);
    return params ? interpolate(resolved, params, numberFormat) : resolved;
  };

  translate.number = (n: number): string => numberFormat.format(n);

  return translate;
};
