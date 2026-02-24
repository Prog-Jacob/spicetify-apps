import { REPO_RAW } from '../lib/repo';

export const fetchLocale = (path: string) => async (locale: string) => {
  const res = await fetch(`${REPO_RAW}/${path}/${locale}.json`);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
};
