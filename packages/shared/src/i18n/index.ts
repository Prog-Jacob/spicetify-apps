import type { MessageValue, PluralEntry, TranslationDict, Translator } from './types';

export type {
  Translator,
  PluralEntry,
  MessageValue,
  BundledLocales,
  TranslationDict,
} from './types';
export { createAppTranslator } from './create-app-translator';

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
  if (template === undefined) return nf.format(count);
  return template.replace(/#/g, nf.format(count));
};

/**
 * A typed translator over `{ locale: dict }`, the first entry being the fallback. `t()` is
 * synchronous; `t.load(fetcher)` swaps in an unbundled locale before first render. Apps use
 * `createAppTranslator`, which layers their messages over `packages/ui`'s.
 */
export const createTranslator = <T extends TranslationDict>(
  locales: Record<string, T>,
): Translator<T> => {
  type Key = keyof T & string;

  const locale = getLocale();
  const baseLocale = locale.split('-')[0];
  const fallback = Object.values(locales)[0];
  const pluralRules = new Intl.PluralRules(locale);
  const numberFormat = new Intl.NumberFormat(locale);
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
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
  translate.date = (ms: number): string => dateFormat.format(ms);

  return translate;
};
