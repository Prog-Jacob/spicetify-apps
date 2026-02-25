import en from './en';
import sharedEn from '@ui/i18n/en';
import { t as sharedT } from '@ui/i18n';
import { createTranslator } from '@shared/i18n';
import { fetchLocale } from '@shared/i18n/fetch-locale';

const combinedTranslations = { ...sharedEn, ...en };

export const t = createTranslator({ en: combinedTranslations });

export type MessageKey = keyof typeof combinedTranslations & string;

export const loadTranslations = () =>
  Promise.all([
    t.load(async (locale) => {
      const [uiStrings, appStrings] = await Promise.all([
        fetchLocale('packages/ui/src/i18n')(locale).catch(() => ({})),
        fetchLocale('apps/data-porter/src/i18n')(locale).catch(() => ({})),
      ]);
      return { ...uiStrings, ...appStrings };
    }),
    sharedT.load(fetchLocale('packages/ui/src/i18n')),
  ]);
