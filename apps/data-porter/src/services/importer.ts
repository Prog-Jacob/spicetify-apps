import { t } from '../i18n';
import { platform } from '@shared/api/platform';
import type { ProgressInfo } from '@shared/types/platform';
import { checkAborted, batchedWrite } from '@shared/api/batch';
import type { ImportLogEntry, ImportResult, PlaylistConflictResolution } from '../types/import';
import type { DataType, ExportData, ExportedPlaylist, PlaylistItemDetail } from '../types/export';

async function importPlaylist(
  playlist: ExportedPlaylist,
  resolution: PlaylistConflictResolution | undefined,
  existingUri: string | undefined,
  log: ImportLogEntry[],
  onProgress: (p: ProgressInfo) => void,
  signal: AbortSignal,
): Promise<void> {
  if (resolution === 'skip') {
    log.push({ label: t('log.playlistSkipped', { name: playlist.name }), status: 'skipped' });
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
      log.push({ label: t('log.playlistFailed', { name: playlist.name }), status: 'error' });
      return;
    }
  }

  if (playlist.description) {
    try {
      const description =
        new DOMParser().parseFromString(playlist.description, 'text/html').body.textContent ??
        playlist.description;
      await platform.PlaylistAPI.updateDetails(targetUri, { description });
    } catch (e) {
      console.warn('[data-porter] Failed to set description:', e);
      log.push({ label: t('log.descriptionFailed', { name: playlist.name }), status: 'skipped' });
    }
  }

  let trackUris = playlist.items.flatMap((i) => (i.track?.trackUri ? [i.track.trackUri] : []));
  const skippedCount = playlist.items.length - trackUris.length;

  if (skippedCount > 0)
    log.push({
      label: t('log.episodesSkipped', { name: playlist.name, count: skippedCount }),
      status: 'skipped',
    });

  // On merge, filter out tracks already in the playlist to avoid duplicates.
  if (resolution === 'merge' && trackUris.length > 0) {
    const detail = await platform.PlaylistAPI.getPlaylist(targetUri);

    if (!detail || detail.error || !detail.contents) {
      log.push({
        label: t('log.mergeReadFailed', { name: playlist.name }),
        status: 'skipped',
      });
    } else {
      const items = (detail.contents.items ?? []) as PlaylistItemDetail[];

      if (items.length > 0) {
        const existing = new Set(items.map((i) => i.uri));
        const before = trackUris.length;
        trackUris = trackUris.filter((uri) => !existing.has(uri));
        const dupes = before - trackUris.length;
        if (dupes > 0)
          log.push({
            label: t('log.duplicatesSkipped', { name: playlist.name, count: dupes }),
            status: 'skipped',
          });
      }
    }
  }

  if (trackUris.length > 0) {
    await batchedWrite(
      trackUris,
      (batch) => platform.PlaylistAPI.add(targetUri, batch, { after: 'end' }),
      {
        label: t('progress.importingPlaylist', { name: playlist.name }),
        signal,
        onProgress,
      },
    );
  }

  if (resolution !== 'merge') {
    try {
      await platform.PlaylistPermissionsAPI.setBasePermission(targetUri, 'BLOCKED');
    } catch (e) {
      console.warn('[data-porter] Failed to set permissions:', e);
      log.push({ label: t('log.permissionFailed', { name: playlist.name }), status: 'skipped' });
    }
  }

  const logKey = resolution === 'merge' ? 'log.playlistMerged' : 'log.playlistCreated';
  log.push({ label: t(logKey, { name: playlist.name, count: trackUris.length }), status: 'ok' });
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
  const allTracks = data.library?.tracks;
  const tracks = allTracks?.filter((tr) => tr.trackUri.startsWith('spotify:track:'));
  const localCount = (allTracks?.length ?? 0) - (tracks?.length ?? 0);
  if (localCount > 0)
    log.push({ label: t('log.localTracks', { count: localCount }), status: 'skipped' });

  const tryWrite = async (label: string, fn: () => Promise<void>): Promise<void> => {
    try {
      await fn();
    } catch (e) {
      checkAborted(signal);
      const detail = e instanceof Error ? e.message : String(e);
      const msg = t('log.failed', { label });
      log.push({ label, status: 'error', detail });
      warnings.push(msg);
      Spicetify.showNotification(msg, true);
    }
  };

  const libraryImports: {
    type: DataType;
    items?: { uri?: string; trackUri?: string }[];
    noun: string;
    progressLabel: string;
  }[] = [
    {
      type: 'likedSongs',
      items: tracks,
      noun: t('dataType.likedSongs'),
      progressLabel: t('progress.savingLikedSongs'),
    },
    {
      type: 'artists',
      items: data.library?.artists,
      noun: t('dataType.artists'),
      progressLabel: t('progress.followingArtists'),
    },
    {
      type: 'shows',
      items: data.library?.shows,
      noun: t('dataType.shows'),
      progressLabel: t('progress.savingShows'),
    },
    {
      type: 'albums',
      items: data.library?.albums,
      noun: t('dataType.albums'),
      progressLabel: t('progress.savingAlbums'),
    },
  ];

  await Promise.all(
    libraryImports.flatMap(({ type, items, noun, progressLabel }) => {
      if (!selected.has(type) || !items?.length) return [];
      const uris = items.map((i) => i.uri ?? i.trackUri).filter((u): u is string => Boolean(u));
      return tryWrite(noun, async () => {
        await batchedWrite(uris, (batch) => platform.LibraryAPI.add({ uris: batch }), {
          label: progressLabel,
          signal,
          onProgress,
        });
        log.push({ label: t('log.saved', { count: uris.length, noun }), status: 'ok' });
      });
    }),
  );

  if (selected.has('playlists') && data.playlists?.length) {
    for (let i = 0; i < data.playlists.length; i++) {
      checkAborted(signal);

      const playlist = data.playlists[i];
      onProgress({
        current: i + 1,
        total: data.playlists.length,
        label: t('progress.importingPlaylist', { name: playlist.name }),
      });

      await tryWrite(playlist.name, () =>
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
