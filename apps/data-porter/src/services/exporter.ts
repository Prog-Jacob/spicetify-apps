import { t } from '../i18n';
import { platform } from '@shared/api/platform';
import { notifyError } from '@shared/lib/errors';
import { formatArtists, toDateString } from '@shared/lib/format';
import type { ProgressInfo, LibraryTrackItem, LibraryContentItem } from '@shared/types/platform';
import {
  BATCH_DELAY_MS,
  PLAYLIST_BATCH_SIZE,
  checkAborted,
  paginate,
} from '@shared/lib/platform-batch';
import type {
  DataType,
  PlaylistItemDetail,
  ExportedPlaylistItem,
  ExportedPlaylist,
  ExportedLibrary,
  ExportData,
  ExportResult,
} from '../types/export';

function toExportedPlaylistItem(item: PlaylistItemDetail): ExportedPlaylistItem {
  const addedDate = item.addedAt ? toDateString(item.addedAt) : '';

  if (item.uri.startsWith('spotify:episode:'))
    return { addedDate, episode: { episodeName: item.name, showName: item.show?.name ?? '' } };

  const trackInfo = {
    trackName: item.name,
    artistName: formatArtists(item.artists),
    albumName: item.album?.name ?? '',
  };

  if (item.uri.startsWith('spotify:local:')) return { addedDate, localTrack: trackInfo };

  return { addedDate, track: { ...trackInfo, trackUri: item.uri } };
}

export async function buildPlaylists(
  playlistItems: LibraryContentItem[],
  onProgress?: (progress: ProgressInfo) => void,
  signal?: AbortSignal,
): Promise<{ playlists: ExportedPlaylist[]; skipped: string[] }> {
  const playlists: ExportedPlaylist[] = [];
  const skipped: string[] = [];

  for (let i = 0; i < playlistItems.length; i++) {
    checkAborted(signal);
    if (i > 0 && i % PLAYLIST_BATCH_SIZE === 0)
      await new Promise<void>((r) => setTimeout(r, BATCH_DELAY_MS));

    const row = playlistItems[i];
    onProgress?.({
      current: i + 1,
      total: playlistItems.length,
      label: t('progress.playlist', { name: row.name }),
    });

    const detail = await platform.PlaylistAPI.getPlaylist(row.uri);
    if (!detail || detail.error || !detail.contents) {
      skipped.push(row.name);
      continue;
    }

    playlists.push({
      name: row.name,
      lastModifiedDate: toDateString(detail.metadata?.lastModified ?? Date.now()),
      items: ((detail.contents.items ?? []) as PlaylistItemDetail[]).map(toExportedPlaylistItem),
      description: detail.metadata?.description ?? null,
      numberOfFollowers: detail.metadata?.totalFollowers ?? 0,
    });
  }

  return { playlists, skipped };
}

export async function exportData(
  selected: Set<DataType>,
  onProgress: (progress: ProgressInfo) => void,
  signal: AbortSignal,
): Promise<ExportResult> {
  const data: ExportData = {};
  const warnings: string[] = [];

  const tryFetch = async <T>(label: string, fn: () => Promise<T>): Promise<T | null> => {
    try {
      return await fn();
    } catch (e) {
      checkAborted(signal);
      const msg = t('warn.fetchFailed', { label });
      warnings.push(msg);
      notifyError(e, msg);
      return null;
    }
  };

  const needsLibraryScan = (['playlists', 'albums', 'artists', 'shows'] as const).some((dt) =>
    selected.has(dt),
  );

  let libraryContents: LibraryContentItem[] | null = null;
  if (needsLibraryScan) {
    onProgress({ current: 0, total: 0, label: t('progress.scanningLibrary') });
    libraryContents = await tryFetch(t('progress.scanningLibrary'), () =>
      paginate<LibraryContentItem>(
        (params) => platform.LibraryAPI.getContents(params),
        'LibraryAPI.getContents',
        onProgress,
        t('progress.scanningLibrary'),
        signal,
      ),
    );
  }

  if (selected.has('playlists') && libraryContents) {
    const playlistItems = libraryContents.filter((i) => i.type === 'playlist');
    onProgress({ current: 0, total: playlistItems.length, label: t('progress.fetchingPlaylists') });
    const result = await tryFetch(t('dataType.playlists'), () =>
      buildPlaylists(playlistItems, onProgress, signal),
    );
    if (result) {
      data.playlists = result.playlists;
      if (result.skipped.length > 0)
        warnings.push(
          t('warn.playlistsFailed', {
            count: result.skipped.length,
            names: result.skipped.join(', '),
          }),
        );
    }
  }

  const library: ExportedLibrary = { tracks: [], albums: [], artists: [], shows: [] };

  if (selected.has('likedSongs')) {
    onProgress({ current: 0, total: 0, label: t('progress.fetchingLikedSongs') });
    const tracks = await tryFetch(t('dataType.likedSongs'), async () => {
      const items = await paginate<LibraryTrackItem>(
        (params) => platform.LibraryAPI.getTracks(params),
        'LibraryAPI.getTracks',
        onProgress,
        t('dataType.likedSongs'),
        signal,
      );
      return items.map((item) => ({
        trackUri: item.uri,
        trackName: item.name,
        artistName: formatArtists(item.artists),
        albumName: item.album?.name ?? '',
      }));
    });
    if (tracks) library.tracks = tracks;
  }

  if (libraryContents) {
    for (const item of libraryContents) {
      if (item.type === 'album' && selected.has('albums'))
        library.albums.push({
          artist: formatArtists(item.artists),
          album: item.name,
          uri: item.uri,
        });
      else if (item.type === 'artist' && selected.has('artists'))
        library.artists.push({ name: item.name, uri: item.uri });
      else if (item.type === 'show' && selected.has('shows'))
        library.shows.push({ name: item.name, publisher: item.publisher ?? '', uri: item.uri });
    }
  }

  if (Object.values(library).some((arr) => arr.length > 0)) data.library = library;

  return { data, warnings };
}
