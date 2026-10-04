import { useState, useEffect } from 'react';
import { useSpicetifyReady } from './use-spicetify-ready';

/** True once Spicetify's platform APIs exist and the app's locale has loaded (or given up). */
export const useAppReady = (loadTranslations: () => Promise<unknown>): boolean => {
  const spicetifyReady = useSpicetifyReady();
  const [i18nReady, setI18nReady] = useState(false);
  useEffect(() => {
    void loadTranslations().finally(() => setI18nReady(true));
  }, [loadTranslations]);
  return spicetifyReady && i18nReady;
};
