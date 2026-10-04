export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Runs `fn` over `items` with at most `limit` in flight, stopping early once `signal` aborts. */
export const mapLimit = async <T>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<void>,
  { signal, onDone }: { signal?: AbortSignal; onDone?: (done: number) => void } = {},
): Promise<void> => {
  let cursor = 0;
  let done = 0;
  const worker = async () => {
    while (cursor < items.length && !signal?.aborted) {
      await fn(items[cursor++]);
      onDone?.(++done);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
};

/** Coalesces writes: `schedule` keeps only the latest value, `flush` writes it now. */
export const debounced = <T>(write: (value: T) => void, ms: number) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: { value: T } | undefined;
  const flush = (): void => {
    clearTimeout(timer);
    if (!pending) return;
    const { value } = pending;
    pending = undefined;
    write(value);
  };
  const schedule = (value: T): void => {
    pending = { value };
    clearTimeout(timer);
    timer = setTimeout(flush, ms);
  };
  return { schedule, flush };
};
