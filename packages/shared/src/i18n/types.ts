export type PluralEntry = { other: string } & Partial<Record<Intl.LDMLPluralRule, string>>;

export type MessageValue = string | PluralEntry;

export type TranslationDict = Record<string, MessageValue>;

export interface Translator<T extends TranslationDict = TranslationDict> {
  (key: keyof T & string, params?: Record<string, string | number>): string;
  load(fetcher: (locale: string) => Promise<Partial<T>>): Promise<void>;
  number(n: number): string;
}
