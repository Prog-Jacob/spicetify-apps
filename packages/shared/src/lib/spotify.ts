export const SPOTIFY_URI = {
  USER: 'spotify:user:',
  TRACK: 'spotify:track:',
  LOCAL: 'spotify:local:',
  ARTIST: 'spotify:artist:',
  EPISODE: 'spotify:episode:',
  YOUR_EPISODES: 'spotify:playlist:37i9dQZF1FgnTBfUlzkeKt',
} as const;

// Opens an entity's page in the Spotify client: `spotify:artist:ID` -> route `/artist/ID`.
export const openUriInClient = (uri: string): void => {
  const [, type, id] = uri.split(':');
  if (type && id) Spicetify.Platform.History.push(`/${type}/${id}`);
};

const IMAGE_URI_PREFIX = 'spotify:image:';

export const spotifyImageUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith(IMAGE_URI_PREFIX))
    return `https://i.scdn.co/image/${url.slice(IMAGE_URI_PREFIX.length)}`;
  return url.startsWith('http') ? url : undefined;
};
