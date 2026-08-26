import { t } from '../i18n';
import { buildPlaylists, emptyLibrary } from './exporter';
import type { ProgressInfo, LibraryContentItem } from '@shared/types';
import type { ExportResult, ExportedPlaylist } from '../types/export';
import { parseUserId, ValidationError, SPOTIFY_URI } from '@shared/lib';
import { PAGE_SIZE, getProfile, getFollowing, getPublicPlaylists } from '@shared/api';

async function fetchUserPlaylists(
  userId: string,
  total: number,
  onProgress: (p: ProgressInfo) => void,
  signal: AbortSignal,
): Promise<LibraryContentItem[]> {
  const items: LibraryContentItem[] = [];

  for (let offset = 0; offset < total; offset += PAGE_SIZE) {
    signal?.throwIfAborted();
    onProgress({ current: offset, total, label: t('progress.fetchingPlaylistList') });

    const page = await getPublicPlaylists(userId, { offset, limit: PAGE_SIZE });
    items.push(...page.map((p) => ({ uri: p.uri, name: p.name, type: 'playlist' as const })));
  }

  return items;
}

export async function exportPublicProfile(
  userInput: string,
  onProgress: (progress: ProgressInfo) => void,
  signal: AbortSignal,
): Promise<ExportResult> {
  const warnings: string[] = [];
  const userId = parseUserId(userInput);
  let playlists: ExportedPlaylist[] = [];
  if (!userId) throw new ValidationError(t('error.invalidProfile'));

  signal?.throwIfAborted();
  onProgress({ current: 0, total: 0, label: t('progress.fetchingProfile') });

  const profile = await getProfile(userId);

  const userName = profile.name;
  const playlistItems = await fetchUserPlaylists(
    userId,
    profile.total_public_playlists_count ?? 0,
    onProgress,
    signal,
  );

  if (playlistItems.length > 0) {
    onProgress({ current: 0, total: playlistItems.length, label: t('progress.fetchingPlaylists') });
    const result = await buildPlaylists(playlistItems, onProgress, signal);
    playlists = result.playlists;
    if (result.warning) warnings.push(result.warning);
  }

  signal?.throwIfAborted();
  onProgress({ current: 0, total: 0, label: t('progress.fetchingArtists') });

  const following = await getFollowing(userId);
  const artists = following
    .filter((p) => p.uri.startsWith(SPOTIFY_URI.ARTIST))
    .map((p) => ({ name: p.name ?? p.uri, uri: p.uri }));

  if (!playlists.length && !artists.length) {
    warnings.push(t('warn.noPublicData'));
  }

  return {
    data: {
      ...(playlists.length > 0 && { playlists }),
      ...(artists.length > 0 && { library: { ...emptyLibrary(), artists } }),
    },
    userName: userName || userId,
    warnings,
  };
}
