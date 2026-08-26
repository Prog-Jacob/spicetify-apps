import type { RootlistItem } from '../types/platform';

export type PlaylistRef = Pick<RootlistItem, 'name' | 'uri' | 'images'>;

const collect = (items: RootlistItem[], out: PlaylistRef[]): void => {
  for (const item of items) {
    if (item.type === 'playlist') out.push({ name: item.name, uri: item.uri, images: item.images });
    else if (item.type === 'folder' && item.items) collect(item.items, out);
  }
};

export async function fetchRootlistPlaylists(signal?: AbortSignal): Promise<PlaylistRef[]> {
  const { items = [] } = await Spicetify.Platform.RootlistAPI.getContents();
  signal?.throwIfAborted();
  const out: PlaylistRef[] = [];
  collect(items, out);
  return out;
}
