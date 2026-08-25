import { fetchRootlistPlaylists } from '@shared/api';

export async function fetchExistingPlaylists(signal?: AbortSignal): Promise<Map<string, string>> {
  const playlists = await fetchRootlistPlaylists(signal);
  const map = new Map<string, string>();
  for (const p of playlists) {
    if (!map.has(p.name)) map.set(p.name, p.uri);
  }
  return map;
}
