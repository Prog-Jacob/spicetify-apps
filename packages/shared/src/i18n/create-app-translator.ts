import { createTranslator } from './index';
import { loadAllTranslations } from './load-translations';
import type { TranslationDict, Translator } from './types';

export const createAppTranslator = <TApp extends TranslationDict, TUi extends TranslationDict>(
  appEn: TApp,
  ui: { t: Translator; en: TUi },
) => {
  const en = { ...ui.en, ...appEn };
  const t = createTranslator({ en });
  return { t, loadTranslations: () => loadAllTranslations(ui.t, t, __BUNDLED_LOCALES__) };
};
