export type PluralEntry = { other: string } & Partial<Record<Intl.LDMLPluralRule, string>>;

export type MessageValue = string | PluralEntry;

export type TranslationDict = Record<string, MessageValue>;
