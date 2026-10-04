const pad = (n: number) => String(n).padStart(2, '0');

export const formatArtists = (artists?: { name: string }[]): string =>
  artists?.map((a) => a.name).join(', ') ?? '';

export const toEpochMs = (value?: string | number): number | undefined => {
  if (value == null) return undefined;
  const ms = typeof value === 'number' ? value : Date.parse(value);
  return Number.isNaN(ms) ? undefined : ms;
};

/** ISO `YYYY-MM-DD` (UTC), for data files. UI dates go through `t.date`. */
export const toDateString = (ms: number): string => {
  const d = new Date(ms);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

export const toDateTimeString = (ms: number): string => {
  const day = toDateString(ms);
  if (!day) return '';
  const d = new Date(ms);
  return `${day} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
};
