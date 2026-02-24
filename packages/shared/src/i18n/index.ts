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
 * Create a typed translator from a `{ locale: dict }` map.
 * The first entry is the fallback. If the user's Spotify locale matches
 * a bundled key, that dict is used immediately. For unbundled locales,
 * call `t.load(fetcher)` before rendering — it fetches the dict at
 * runtime and falls back silently on failure. `t()` is always synchronous.
 *
 * Usage:
 * ```ts
 * import en from './en';
 * const t = createTranslator({ en });
 * await t.load(fetchLocale('apps/my-app/src/i18n'));
 * t('export.title');
 * t('export.count', { selected: 3, total: 5 });
 * t('conflict.exists', { count: 2 });
 * ```
 */
export const createTranslator = <T extends TranslationDict>(locales: Record<string, T>) => {
  type Key = keyof T & string;

  const locale = getLocale();
  const baseLocale = locale.split('-')[0];
  const fallback = Object.values(locales)[0];
  const pluralRules = new Intl.PluralRules(locale);
  const numberFormat = new Intl.NumberFormat(locale);
  let dict: T = baseLocale in locales ? { ...fallback, ...locales[baseLocale] } : fallback;

  const translate = (key: Key, params?: Record<string, string | number>): string => {
    const value: MessageValue | undefined = dict[key];

    if (value === undefined) return key;

    const resolved =
      typeof value === 'string'
        ? value
        : resolvePlural(value, Number(params?.count) || 0, pluralRules, numberFormat);

    return params ? interpolate(resolved, params, numberFormat) : resolved;
  };

  translate.load = async (fetcher: (locale: string) => Promise<Partial<T>>): Promise<void> => {
    if (baseLocale in locales) return;
    try {
      const loaded = await fetcher(baseLocale);
      dict = { ...fallback, ...loaded };
    } catch {
      /* silent — use fallback dict */
    }
  };

  translate.number = (n: number): string => numberFormat.format(n);

  return translate;
};
