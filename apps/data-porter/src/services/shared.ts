import type { ProgressInfo, LibraryPage } from '@shared/types/platform';

export const PAGE_SIZE = 200;
export const BATCH_DELAY_MS = 500;
export const PLAYLIST_BATCH_SIZE = 10;

export function checkAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
}

export async function batchedWrite(
  items: string[],
  batchSize: number,
  label: string,
  signal: AbortSignal,
  onProgress: (p: ProgressInfo) => void,
  write: (batch: string[]) => Promise<void>,
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    checkAborted(signal);
    await write(items.slice(i, i + batchSize));
    onProgress({
      current: Math.min(i + batchSize, items.length),
      total: items.length,
      label,
    });
    if (i + batchSize < items.length) await new Promise<void>((r) => setTimeout(r, BATCH_DELAY_MS));
  }
}

// Platform APIs resolve with error bodies instead of throwing.
function validatePage<T>(response: unknown, context: string): LibraryPage<T> {
  const res = response as Record<string, unknown> | null;
  if (!res || typeof res !== 'object') throw new Error(`${context}: invalid response`);
  if (res.error) {
    const err = res.error as { status?: number; message?: string };
    throw new Error(
      `${context}: API error ${err.status ?? 'unknown'} - ${err.message ?? 'no details'}`,
    );
  }
  if (
    !Array.isArray(res.items) ||
    typeof res.totalLength !== 'number' ||
    typeof res.limit !== 'number'
  )
    throw new Error(`${context}: invalid page structure`);
  return response as LibraryPage<T>;
}

export async function paginate<T>(
  fetch: (params: { limit: number; offset: number }) => Promise<unknown>,
  context: string,
  onProgress?: (progress: ProgressInfo) => void,
  label?: string,
  signal?: AbortSignal,
): Promise<T[]> {
  let offset = 0;
  const items: T[] = [];

  for (;;) {
    checkAborted(signal);
    const page = validatePage<T>(await fetch({ limit: PAGE_SIZE, offset }), context);
    items.push(...page.items);
    onProgress?.({ current: items.length, total: page.totalLength, label: label ?? context });
    offset += page.limit;
    if (offset >= page.totalLength) break;
  }

  return items;
}
