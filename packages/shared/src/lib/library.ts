import { platform } from '../api/platform';
import { paginate } from './platform-batch';
import type { LibraryContentItem } from '../types/platform';

export async function fetchExistingPlaylists(): Promise<Map<string, string>> {
  const items = await paginate<LibraryContentItem>(
    (params) => platform.LibraryAPI.getContents(params),
    'LibraryAPI.getContents',
  );

  return new Map(items.filter((i) => i.type === 'playlist').map((i) => [i.name, i.uri]));
}
