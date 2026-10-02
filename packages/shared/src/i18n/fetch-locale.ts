import { REPO_RAW } from '../lib/repo';
import type { TranslationDict } from './types';

// Apps render nothing until locales settle, so a stalled request must give up.
const TIMEOUT_MS = 5000;

export const fetchLocale =
  (path: string, bundled: Record<string, TranslationDict> = {}) =>
  async (locale: string): Promise<TranslationDict> => {
    if (locale in bundled) return bundled[locale];
    const res = await fetch(`${REPO_RAW}/${path}/${locale}.json`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  };
