import { platform } from '@shared/api/platform';
import type {
  DataType,
  LibraryTrackItem,
  LibraryContentItem,
  LibraryPage,
  PlaylistItemDetail,
  ExportedPlaylistItem,
  ExportedPlaylist,
  ExportedLibrary,
  ExportData,
  ExportProgress,
} from '../types/export';

const PAGE_SIZE = 200;
const BATCH_DELAY_MS = 500;
const PLAYLIST_BATCH_SIZE = 10;

function toDateString(ms: number): string {
  const d = new Date(ms);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

function formatArtists(artists?: { name: string }[]): string {
  return artists?.map((a) => a.name).join(', ') ?? '';
}

function checkAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError');
}

// Platform APIs resolve with error bodies instead of throwing.
function validatePage<T>(response: unknown, context: string): LibraryPage<T> {
  const res = response as Record<string, unknown> | null;
  if (!res || typeof res !== 'object') throw new Error(`${context}: invalid response`);
  if (res.error) {
    const err = res.error as { status?: number; message?: string };
    throw new Error(
      `${context}: API error ${err.status ?? 'unknown'} - ${err.message ?? 'no details'}`,
    );
  }
  if (
    !Array.isArray(res.items) ||
    typeof res.totalLength !== 'number' ||
    typeof res.limit !== 'number'
  )
    throw new Error(`${context}: invalid page structure`);
  return response as LibraryPage<T>;
}

async function paginate<T>(
  fetch: (params: { limit: number; offset: number }) => Promise<unknown>,
  context: string,
  onProgress?: (progress: ExportProgress) => void,
  label?: string,
  signal?: AbortSignal,
): Promise<T[]> {
  let offset = 0;
  const items: T[] = [];

  for (;;) {
    checkAborted(signal);
    const page = validatePage<T>(await fetch({ limit: PAGE_SIZE, offset }), context);
    items.push(...page.items);
    onProgress?.({ current: items.length, total: page.totalLength, label: label ?? context });
    offset += page.limit;
    if (offset >= page.totalLength) break;
  }

  return items;
}

function toExportedPlaylistItem(item: PlaylistItemDetail): ExportedPlaylistItem {
  const addedDate = item.addedAt ? toDateString(item.addedAt) : '';
  const base = { track: null, episode: null, localTrack: null, addedDate };

  if (item.uri.startsWith('spotify:episode:'))
    return { ...base, episode: { episodeName: item.name, showName: item.show?.name ?? '' } };

  const trackInfo = {
    trackName: item.name,
    artistName: formatArtists(item.artists),
    albumName: item.album?.name ?? '',
  };

  if (item.uri.startsWith('spotify:local:')) return { ...base, localTrack: trackInfo };

  return { ...base, track: { ...trackInfo, trackUri: item.uri } };
}

async function buildPlaylists(
  playlistItems: LibraryContentItem[],
  onProgress?: (progress: ExportProgress) => void,
  signal?: AbortSignal,
): Promise<{ playlists: ExportedPlaylist[]; skipped: string[] }> {
  const playlists: ExportedPlaylist[] = [];
  const skipped: string[] = [];

  for (let i = 0; i < playlistItems.length; i++) {
    checkAborted(signal);
    if (i > 0 && i % PLAYLIST_BATCH_SIZE === 0)
      await new Promise<void>((r) => setTimeout(r, BATCH_DELAY_MS));

    const row = playlistItems[i];
    onProgress?.({ current: i + 1, total: playlistItems.length, label: `Playlist: ${row.name}` });

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
  onProgress: (progress: ExportProgress) => void,
  signal: AbortSignal,
): Promise<{ data: ExportData; warnings: string[] }> {
  const data: ExportData = {};
  const warnings: string[] = [];

  const tryFetch = async <T>(label: string, fn: () => Promise<T>): Promise<T | null> => {
    try {
      return await fn();
    } catch (e) {
      checkAborted(signal);
      const msg = `Failed to fetch ${label.toLowerCase()}`;
      warnings.push(msg);
      Spicetify.showNotification(`${msg}: ${e}`, true);
      return null;
    }
  };

  const needsLibraryScan = ['playlists', 'albums', 'artists', 'shows'].some((t) =>
    selected.has(t as DataType),
  );

  let libraryContents: LibraryContentItem[] | null = null;
  if (needsLibraryScan) {
    onProgress({ current: 0, total: 0, label: 'Scanning library...' });
    libraryContents = await tryFetch('Library', () =>
      paginate<LibraryContentItem>(
        (params) => platform.LibraryAPI.getContents(params),
        'LibraryAPI.getContents',
        onProgress,
        'Scanning library...',
        signal,
      ),
    );
  }

  if (selected.has('playlists') && libraryContents) {
    const playlistItems = libraryContents.filter((i) => i.type === 'playlist');
    onProgress({ current: 0, total: playlistItems.length, label: 'Fetching playlists...' });
    const result = await tryFetch('Playlists', () =>
      buildPlaylists(playlistItems, onProgress, signal),
    );
    if (result) {
      data.playlists = result.playlists;
      if (result.skipped.length > 0)
        warnings.push(
          `${result.skipped.length} playlist(s) failed to load: ${result.skipped.join(', ')}`,
        );
    }
  }

  const library: ExportedLibrary = { tracks: [], albums: [], artists: [], shows: [] };

  if (selected.has('likedSongs')) {
    onProgress({ current: 0, total: 0, label: 'Fetching liked songs...' });
    const tracks = await tryFetch('Liked Songs', async () => {
      const items = await paginate<LibraryTrackItem>(
        (params) => platform.LibraryAPI.getTracks(params),
        'LibraryAPI.getTracks',
        onProgress,
        'Liked Songs',
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

export function downloadJson(data: ExportData, filename?: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), {
    href: url,
    download: filename ?? `spotify-export-${new Date().toISOString().slice(0, 10)}.json`,
  }).click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
