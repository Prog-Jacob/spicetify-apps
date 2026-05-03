const pad = (n: number) => String(n).padStart(2, '0');

export const formatArtists = (artists?: { name: string }[]): string =>
  artists?.map((a) => a.name).join(', ') ?? '';

export const toDateString = (ms: number): string => {
  const d = new Date(ms);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

export const toDateTimeString = (ms: number): string => {
  const d = new Date(ms);
  const dateString = toDateString(ms);
  if (isNaN(d.getTime()) || !dateString) return '';
  return `${dateString} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
};

export function parseUserId(input: string): string {
  const trimmed = input.trim();

  // https://open.spotify.com/user/abc123?si=...
  const urlMatch = trimmed.match(/^https?:\/\/open\.spotify\.com\/user\/([^/?#]+)/);
  if (urlMatch) return decodeURIComponent(urlMatch[1]);

  // spotify:user:abc123
  const uriMatch = trimmed.match(/^spotify:user:(.+)$/);
  return uriMatch ? uriMatch[1] : trimmed;
}
