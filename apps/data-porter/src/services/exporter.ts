import { t } from '../i18n';
import { DATA_TYPE } from '../constants';
import { notifyError, formatArtists, toDateString, SPOTIFY_URI } from '@shared/lib';
import type { ProgressInfo, LibraryTrackItem, LibraryContentItem } from '@shared/types';
import { platform, BATCH_DELAY_MS, PLAYLIST_BATCH_SIZE, checkAborted, paginate } from '@shared/api';
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

  if (item.uri.startsWith(SPOTIFY_URI.EPISODE))
    return { addedDate, episode: { episodeName: item.name, showName: item.show?.name ?? '' } };

  const trackInfo = {
    trackName: item.name,
    artistName: formatArtists(item.artists),
    albumName: item.album?.name ?? '',
  };

  if (item.uri.startsWith(SPOTIFY_URI.LOCAL)) return { addedDate, localTrack: trackInfo };

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

    let detail;
    try {
      detail = await platform.PlaylistAPI.getPlaylist(row.uri);
    } catch {
      /* Handled in the next if statement */
    }

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

  const needsLibraryScan = (
    [DATA_TYPE.PLAYLISTS, DATA_TYPE.ALBUMS, DATA_TYPE.ARTISTS, DATA_TYPE.SHOWS] as const
  ).some((dt) => selected.has(dt));

  let libraryContents: LibraryContentItem[] | null = null;
  if (needsLibraryScan) {
    onProgress({ current: 0, total: 0, label: t('progress.scanningLibrary') });
    libraryContents = await tryFetch(t('progress.scanningLibrary'), () =>
      paginate<LibraryContentItem>((params) => platform.LibraryAPI.getContents(params), {
        context: 'LibraryAPI.getContents',
        onProgress,
        label: t('progress.scanningLibrary'),
        signal,
      }),
    );
  }

  if (selected.has(DATA_TYPE.PLAYLISTS) && libraryContents) {
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

  if (selected.has(DATA_TYPE.LIKED_SONGS)) {
    onProgress({ current: 0, total: 0, label: t('progress.fetchingLikedSongs') });
    const tracks = await tryFetch(t('dataType.likedSongs'), async () => {
      const items = await paginate<LibraryTrackItem>(
        (params) => platform.LibraryAPI.getTracks(params),
        {
          context: 'LibraryAPI.getTracks',
          onProgress,
          label: t('dataType.likedSongs'),
          signal,
        },
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
      if (item.type === 'album' && selected.has(DATA_TYPE.ALBUMS))
        library.albums.push({
          artist: formatArtists(item.artists),
          album: item.name,
          uri: item.uri,
        });
      else if (item.type === 'artist' && selected.has(DATA_TYPE.ARTISTS))
        library.artists.push({ name: item.name, uri: item.uri });
      else if (item.type === 'show' && selected.has(DATA_TYPE.SHOWS))
        library.shows.push({ name: item.name, publisher: item.publisher ?? '', uri: item.uri });
    }
  }

  if (Object.values(library).some((arr) => arr.length > 0)) data.library = library;

  return { data, warnings };
}
