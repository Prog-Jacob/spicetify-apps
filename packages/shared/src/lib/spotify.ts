import type { SpotifyImage } from '../types/platform';

export const SPOTIFY_URI = {
  USER: 'spotify:user:',
  TRACK: 'spotify:track:',
  LOCAL: 'spotify:local:',
  ARTIST: 'spotify:artist:',
  EPISODE: 'spotify:episode:',
  LIKED_SONGS: 'spotify:collection:tracks',
  YOUR_EPISODES: 'spotify:playlist:37i9dQZF1FgnTBfUlzkeKt',
} as const;

export type SpotifyRef = { type: string; id: string; uri: string };

const decode = (raw: string): string => {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

const URI_RE = /^spotify:([a-z]+):([^:?#\s]+)/i;
// open.spotify.com links may carry one prefix segment: /intl-de/artist/..., /embed/playlist/...
const URL_RE = /^https?:\/\/open\.spotify\.com\/(?:[a-z-]+\/)?([a-z]+)\/([^/?#\s]+)/i;

/** Parses a `spotify:<type>:<id>` URI or an open.spotify.com link, optionally limited to `types`. */
export const parseSpotifyRef = (input: string, types?: readonly string[]): SpotifyRef | null => {
  const s = input.trim();
  const match = s.match(URI_RE) ?? s.match(URL_RE);
  if (!match) return null;
  const type = match[1].toLowerCase();
  if (types && !types.includes(type)) return null;
  const id = decode(match[2]);
  return { type, id, uri: `spotify:${type}:${id}` };
};

/** A user id from a profile link, a `spotify:user:` URI, or a bare username. */
export const parseUserId = (input: string): string =>
  parseSpotifyRef(input, ['user'])?.id ?? input.trim();

// Opens an entity's page in the Spotify client: `spotify:artist:ID` -> route `/artist/ID`.
export const openUriInClient = (uri: string): void => {
  const [, type, id] = uri.split(':');
  if (type && id) Spicetify.Platform.History.push(`/${type}/${id}`);
};

const IMAGE_URI_PREFIX = 'spotify:image:';
const MOSAIC_URI_PREFIX = 'spotify:mosaic:';

export const spotifyImageUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith(IMAGE_URI_PREFIX))
    return `https://i.scdn.co/image/${url.slice(IMAGE_URI_PREFIX.length)}`;
  if (url.startsWith(MOSAIC_URI_PREFIX))
    return `https://i.scdn.co/image/${url.slice(MOSAIC_URI_PREFIX.length).split(':')[0]}`;
  return url.startsWith('http') ? url : undefined;
};

export const firstImageUrl = (images?: SpotifyImage[]): string | undefined =>
  spotifyImageUrl(images?.[0]?.url);
