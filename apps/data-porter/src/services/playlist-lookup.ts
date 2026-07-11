import type { RootlistItem } from '@shared/types';
import { platform, checkAborted } from '@shared/api';

export type PlaylistRef = Pick<RootlistItem, 'name' | 'uri'>;

function collect(items: RootlistItem[], out: PlaylistRef[]): void {
  for (const item of items) {
    if (item.type === 'playlist') out.push({ name: item.name, uri: item.uri });
    else if (item.type === 'folder' && item.items) collect(item.items, out);
  }
}

export async function fetchRootlistPlaylists(signal?: AbortSignal): Promise<PlaylistRef[]> {
  const { items = [] } = await platform.RootlistAPI.getContents();
  checkAborted(signal);
  const out: PlaylistRef[] = [];
  collect(items, out);
  return out;
}

export async function fetchExistingPlaylists(signal?: AbortSignal): Promise<Map<string, string>> {
  const playlists = await fetchRootlistPlaylists(signal);
  const map = new Map<string, string>();
  for (const p of playlists) {
    if (!map.has(p.name)) map.set(p.name, p.uri);
  }
  return map;
}
