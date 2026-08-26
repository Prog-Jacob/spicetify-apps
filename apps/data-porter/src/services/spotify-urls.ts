import { parseUserId } from '@shared/lib';

/**
 * Whether an input refers to a Spotify profile (to fetch in-memory) rather than
 * a generic URL pointing at an export file (to download). Reuses `parseUserId`,
 * which rewrites the input only when it matches a profile link or `spotify:user:`
 * URI; an unchanged result is a bare username (profile) unless it's an http(s) URL.
 */
export const isProfileInput = (input: string): boolean => {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (parseUserId(trimmed) !== trimmed) return true;
  return !/^https?:\/\//i.test(trimmed);
};
