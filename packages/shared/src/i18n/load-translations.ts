import { fetchLocale } from './fetch-locale';
import type { BundledLocales, Translator } from './types';

const SHARED_I18N_PATH = 'packages/ui/src/i18n';

export const loadAllTranslations = (
  sharedT: Translator,
  appT: Translator,
  bundled: BundledLocales = {},
) => {
  const fetchShared = fetchLocale(SHARED_I18N_PATH, bundled.shared);
  let shared: ReturnType<typeof fetchShared> | undefined; // one request serves both translators
  const fetchSharedMessages = (locale: string) => (shared ??= fetchShared(locale));

  return Promise.all([
    appT.load(async (locale) => {
      const [sharedMessages, appMessages] = await Promise.all([
        fetchSharedMessages(locale).catch(() => ({})),
        fetchLocale(`apps/${__APP_NAME__}/src/i18n`, bundled.app)(locale).catch(() => ({})),
      ]);
      return { ...sharedMessages, ...appMessages };
    }),
    sharedT.load(fetchSharedMessages),
  ]);
};
