import { t } from '../i18n';
import type { ProgressInfo } from '@shared/types';
import { buildPlaylists, emptyLibrary } from './exporter';
import type { ExportResult, ExportedPlaylist } from '../types/export';
import { parseUserId, ValidationError, SPOTIFY_URI } from '@shared/lib';
import { getProfile, getFollowing, listPublicPlaylists } from '@shared/api';

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
  const total = profile.total_public_playlists_count;
  const progress = (current: number) =>
    onProgress({ current, total: total ?? 0, label: t('progress.fetchingPlaylistList') });
  progress(0);
  const playlistItems = await listPublicPlaylists(userId, { signal, onProgress: progress });

  if (playlistItems.length > 0) {
    onProgress({ current: 0, total: playlistItems.length, label: t('progress.fetchingPlaylists') });
    const result = await buildPlaylists(playlistItems, onProgress, signal);
    playlists = result.playlists;
    if (result.warning) warnings.push(result.warning);
  }

  signal?.throwIfAborted();
  onProgress({ current: 0, total: 0, label: t('progress.fetchingArtists') });

  const following = await getFollowing(userId);
  const artists = following.flatMap(({ uri, name }) =>
    uri?.startsWith(SPOTIFY_URI.ARTIST) ? [{ name: name ?? uri, uri }] : [],
  );

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
