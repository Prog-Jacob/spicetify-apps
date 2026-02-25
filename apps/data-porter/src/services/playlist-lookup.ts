import { paginate } from '@shared/api/batch';
import { platform } from '@shared/api/platform';
import type { LibraryContentItem } from '@shared/types/platform';

export async function fetchExistingPlaylists(signal?: AbortSignal): Promise<Map<string, string>> {
  const items = await paginate<LibraryContentItem>(
    (params) => platform.LibraryAPI.getContents(params),
    { context: 'LibraryAPI.getContents', signal },
  );

  return new Map(items.filter((i) => i.type === 'playlist').map((i) => [i.name, i.uri]));
}
