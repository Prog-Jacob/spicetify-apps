import type { PlaylistDetail } from '../types/platform';

/** A playlist's details, or null when the client answers with an error body instead of throwing. */
export const getPlaylist = async (uri: string): Promise<PlaylistDetail | null> => {
  const detail = await Spicetify.Platform.PlaylistAPI.getPlaylist(uri);
  return detail && !detail.error && detail.contents ? detail : null;
};
