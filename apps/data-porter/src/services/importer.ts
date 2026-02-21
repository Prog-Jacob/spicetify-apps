import {
  BATCH_DELAY_MS,
  PLAYLIST_BATCH_SIZE,
  checkAborted,
  batchedWrite,
  paginate,
} from './shared';
import type {
  DataType,
  ExportData,
  ExportedPlaylist,
  PlaylistItemDetail,
} from '../types/export';
import { platform } from '@shared/api/platform';
import type { LibraryContentItem, ProgressInfo } from '@shared/types/platform';
import type { ImportLogEntry, ImportResult, PlaylistConflictResolution } from '../types/import';

const WRITE_BATCH_SIZE = 50;

async function addToLibraryBatched(
  uris: string[],
  label: string,
  onProgress: (p: ProgressInfo) => void,
  signal: AbortSignal,
): Promise<void> {
  await batchedWrite(uris, WRITE_BATCH_SIZE, label, signal, onProgress, (batch) =>
    platform.LibraryAPI.add({ uris: batch }),
  );
}

async function importLikedSongs(
  tracks: NonNullable<ExportData['library']>['tracks'],
  log: ImportLogEntry[],
  onProgress: (p: ProgressInfo) => void,
  signal: AbortSignal,
): Promise<void> {
  const spotifyTracks = tracks.filter((t) => t.trackUri.startsWith('spotify:track:'));
  const localCount = tracks.length - spotifyTracks.length;
  if (localCount > 0)
    log.push({
      label: `${localCount} local/non-Spotify track(s)`,
      status: 'skipped',
      detail: 'Cannot import local tracks',
    });

  if (spotifyTracks.length === 0) return;

  await addToLibraryBatched(
    spotifyTracks.map((t) => t.trackUri),
    'Saving liked songs...',
    onProgress,
    signal,
  );
  log.push({ label: `${spotifyTracks.length} liked song(s)`, status: 'ok' });
}

async function importPlaylist(
  playlist: ExportedPlaylist,
  resolution: PlaylistConflictResolution | undefined,
  existingUri: string | undefined,
  log: ImportLogEntry[],
  onProgress: (p: ProgressInfo) => void,
  signal: AbortSignal,
): Promise<void> {
  if (resolution === 'skip') {
    log.push({
      label: `Playlist "${playlist.name}"`,
      status: 'skipped',
      detail: 'Skipped (already exists)',
    });
    return;
  }

  let targetUri: string;

  if (resolution === 'merge' && existingUri) {
    targetUri = existingUri;
  } else {
    const result = await platform.RootlistAPI.createPlaylist(playlist.name, {
      before: 'start',
    });
    targetUri = typeof result === 'string' ? result : ((result as { uri?: string })?.uri ?? '');
    if (!targetUri) {
      log.push({
        label: `Playlist "${playlist.name}"`,
        status: 'error',
        detail: 'Failed to create playlist',
      });
      return;
    }
  }

  let trackUris = playlist.items.flatMap((i) => (i.track?.trackUri ? [i.track.trackUri] : []));
  const skippedCount = playlist.items.length - trackUris.length;

  if (skippedCount > 0)
    log.push({
      label: `Playlist "${playlist.name}": ${skippedCount} item(s)`,
      status: 'skipped',
      detail: 'Episodes/local tracks cannot be imported',
    });

  // On merge, filter out tracks already in the playlist to avoid duplicates.
  if (resolution === 'merge' && trackUris.length > 0) {
    const detail = await platform.PlaylistAPI.getPlaylist(targetUri);
    if (detail?.contents?.items) {
      const existing = new Set((detail.contents.items as PlaylistItemDetail[]).map((i) => i.uri));
      const before = trackUris.length;
      trackUris = trackUris.filter((uri) => !existing.has(uri));
      const dupes = before - trackUris.length;
      if (dupes > 0)
        log.push({
          label: `Playlist "${playlist.name}": ${dupes} duplicate(s)`,
          status: 'skipped',
          detail: 'Already in playlist',
        });
    }
  }

  if (trackUris.length > 0) {
    await batchedWrite(
      trackUris,
      WRITE_BATCH_SIZE,
      `Adding tracks to "${playlist.name}"...`,
      signal,
      onProgress,
      (batch) => platform.PlaylistAPI.add(targetUri, batch, { after: 'end' }),
    );
  }

  const action = resolution === 'merge' ? 'Merged into' : 'Created';
  log.push({
    label: `${action} playlist "${playlist.name}" (${trackUris.length} track${trackUris.length !== 1 ? 's' : ''} added)`,
    status: 'ok',
  });
}

export async function importData(
  data: ExportData,
  selected: Set<DataType>,
  conflictResolutions: Map<string, PlaylistConflictResolution>,
  existingPlaylistUris: Map<string, string>,
  onProgress: (p: ProgressInfo) => void,
  signal: AbortSignal,
): Promise<ImportResult> {
  const warnings: string[] = [];
  const log: ImportLogEntry[] = [];
  const tracks = data.library?.tracks;

  const tryWrite = async (label: string, fn: () => Promise<void>): Promise<void> => {
    try {
      await fn();
    } catch (e) {
      checkAborted(signal);
      const detail = String(e);
      log.push({ label, status: 'error', detail });
      warnings.push(`Failed: ${label}`);
      Spicetify.showNotification(`Failed: ${label}`, true);
    }
  };

  if (selected.has('likedSongs') && tracks?.length) {
    await tryWrite('Liked Songs', () => importLikedSongs(tracks, log, onProgress, signal));
  }

  const uriImports: {
    type: DataType;
    items?: { uri: string }[];
    noun: string;
    progressLabel: string;
  }[] = [
    {
      type: 'albums',
      items: data.library?.albums,
      noun: 'album(s)',
      progressLabel: 'Saving albums...',
    },
    {
      type: 'artists',
      items: data.library?.artists,
      noun: 'artist(s)',
      progressLabel: 'Following artists...',
    },
    {
      type: 'shows',
      items: data.library?.shows,
      noun: 'show(s)',
      progressLabel: 'Saving shows...',
    },
  ];

  for (const { type, items, noun, progressLabel } of uriImports) {
    if (!selected.has(type) || !items?.length) continue;
    const uris = items.map((i) => i.uri).filter(Boolean);
    await tryWrite(noun, async () => {
      await addToLibraryBatched(uris, progressLabel, onProgress, signal);
      log.push({ label: `${uris.length} ${noun}`, status: 'ok' });
    });
  }

  if (selected.has('playlists') && data.playlists?.length) {
    for (let i = 0; i < data.playlists.length; i++) {
      checkAborted(signal);
      if (i > 0 && i % PLAYLIST_BATCH_SIZE === 0)
        await new Promise<void>((r) => setTimeout(r, BATCH_DELAY_MS));

      const playlist = data.playlists[i];
      onProgress({
        current: i + 1,
        total: data.playlists.length,
        label: `Importing playlist "${playlist.name}"...`,
      });

      await tryWrite(`Playlist "${playlist.name}"`, () =>
        importPlaylist(
          playlist,
          conflictResolutions.get(playlist.name),
          existingPlaylistUris.get(playlist.name),
          log,
          onProgress,
          signal,
        ),
      );
    }
  }

  return { log, warnings };
}

export async function fetchExistingPlaylists(): Promise<Map<string, string>> {
  const items = await paginate<LibraryContentItem>(
    (params) => platform.LibraryAPI.getContents(params),
    'LibraryAPI.getContents',
  );
  const byName = new Map<string, string>();
  for (const item of items) {
    if (item.type === 'playlist') byName.set(item.name, item.uri);
  }
  return byName;
}
