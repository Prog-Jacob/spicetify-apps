import { REPO_RAW } from '../lib/repo';
import type { TranslationDict } from './types';

export const fetchLocale =
  (path: string, bundled: Record<string, TranslationDict> = {}) =>
  async (locale: string): Promise<TranslationDict> => {
    if (locale in bundled) return bundled[locale];
    const res = await fetch(`${REPO_RAW}/${path}/${locale}.json`);
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  };
