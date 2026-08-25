export const SPOTIFY_URI = {
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
