import { validateResponse } from './cosmos';
import type { ProgressInfo, LibraryPage } from '../types/platform';

export const PAGE_SIZE = 200;
export const BATCH_DELAY_MS = 500;
export const WRITE_BATCH_SIZE = 50;
export const PLAYLIST_BATCH_SIZE = 10;

type WriteOptions = {
  label: string;
  signal?: AbortSignal;
  onProgress?: (p: ProgressInfo) => void;
};

type PaginateOptions = {
  label?: string;
  context: string;
  signal?: AbortSignal;
  onProgress?: (p: ProgressInfo) => void;
};

export async function batchedWrite(
  items: string[],
  write: (batch: string[]) => Promise<void>,
  { label, signal, onProgress }: WriteOptions,
): Promise<void> {
  for (let i = 0; i < items.length; i += WRITE_BATCH_SIZE) {
    signal?.throwIfAborted();
    await write(items.slice(i, i + WRITE_BATCH_SIZE));
    onProgress?.({
      current: Math.min(i + WRITE_BATCH_SIZE, items.length),
      total: items.length,
      label,
    });
  }
}

function validatePage<T>(response: unknown, context: string): LibraryPage<T> {
  const res = validateResponse<Record<string, unknown>>(response, context);
  if (
    !Array.isArray(res.items) ||
    typeof res.totalLength !== 'number' ||
    typeof res.offset !== 'number' ||
    typeof res.limit !== 'number' ||
    res.limit <= 0
  )
    throw new Error(`${context}: invalid page structure`);
  return res as LibraryPage<T>;
}

export async function paginate<T>(
  fetch: (params: { limit: number; offset: number }) => Promise<unknown>,
  options: PaginateOptions,
): Promise<T[]> {
  let offset = 0;
  const items: T[] = [];
  const { context, signal, onProgress, label = context } = options;

  for (;;) {
    signal?.throwIfAborted();
    const page = validatePage<T>(await fetch({ limit: PAGE_SIZE, offset }), context);
    items.push(...page.items);
    onProgress?.({ current: items.length, total: page.totalLength, label });
    if (page.items.length === 0 || offset + page.items.length >= page.totalLength) break;
    offset += page.items.length;
  }

  return items;
}
