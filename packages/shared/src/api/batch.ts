import { validateResponse } from './cosmos';
import type { ProgressInfo, LibraryPage } from '../types/platform';

export const PAGE_SIZE = 200;
export const BATCH_DELAY_MS = 500;
export const WRITE_BATCH_SIZE = 50;
export const PLAYLIST_BATCH_SIZE = 10;

export type WriteOptions = {
  label: string;
  delayMs?: number;
  batchSize?: number;
  signal?: AbortSignal;
  onProgress?: (p: ProgressInfo) => void;
};

export type PaginateOptions = {
  label?: string;
  context: string;
  signal?: AbortSignal;
  onProgress?: (p: ProgressInfo) => void;
};

export function checkAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
}

export async function batchedWrite(
  items: string[],
  write: (batch: string[]) => Promise<void>,
  options: WriteOptions,
): Promise<void> {
  const { label, signal, onProgress, batchSize = WRITE_BATCH_SIZE, delayMs = 0 } = options;

  for (let i = 0; i < items.length; i += batchSize) {
    checkAborted(signal);
    await write(items.slice(i, i + batchSize));
    onProgress?.({
      current: Math.min(i + batchSize, items.length),
      total: items.length,
      label,
    });
    if (i + batchSize < items.length) await new Promise<void>((r) => setTimeout(r, delayMs));
  }
}

function validatePage<T>(response: unknown, context: string): LibraryPage<T> {
  const res = validateResponse<Record<string, unknown>>(response, context);
  if (
    !Array.isArray(res.items) ||
    typeof res.totalLength !== 'number' ||
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
    checkAborted(signal);
    const page = validatePage<T>(await fetch({ limit: PAGE_SIZE, offset }), context);
    items.push(...page.items);
    onProgress?.({ current: items.length, total: page.totalLength, label });
    offset += page.limit;
    if (offset >= page.totalLength) break;
  }

  return items;
}
