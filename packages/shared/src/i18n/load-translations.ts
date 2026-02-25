import type { Translator } from './types';
import { fetchLocale } from './fetch-locale';

const SHARED_I18N_PATH = 'packages/ui/src/i18n';
const fetchSharedMessages = fetchLocale(SHARED_I18N_PATH);

export const loadAllTranslations = (sharedT: Translator, appT: Translator) =>
  Promise.all([
    appT.load(async (locale) => {
      const [sharedMessages, appMessages] = await Promise.all([
        fetchSharedMessages(locale).catch(() => ({})),
        fetchLocale(`apps/${__APP_NAME__}/src/i18n`)(locale).catch(() => ({})),
      ]);
      return { ...sharedMessages, ...appMessages };
    }),
    sharedT.load(fetchSharedMessages),
  ]);
