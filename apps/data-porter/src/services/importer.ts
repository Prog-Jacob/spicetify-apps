import { t } from '../i18n';
import { batchedWrite } from '@shared/api';
import type { ProgressInfo } from '@shared/types';
import { sleep, SPOTIFY_URI, notifyError } from '@shared/lib';
import type { DataType, ExportData, ExportedPlaylist } from '../types/export';
import type { ImportLogEntry, ImportResult, PlaylistConflictResolution } from '../types/import';
import {
  BAN_SET,
  DATA_TYPE,
  LOG_STATUS,
  CONFLICT_RESOLUTION,
  PERMISSION_SETTLE_MS,
} from '../constants';

async function importPlaylist(
  playlist: ExportedPlaylist,
  resolution: PlaylistConflictResolution | undefined,
  existingUri: string | undefined,
  log: ImportLogEntry[],
  onProgress: (p: ProgressInfo) => void,
  signal: AbortSignal,
  onCreated: (uri: string) => void,
): Promise<void> {
  if (resolution === CONFLICT_RESOLUTION.SKIP) {
    log.push({
      label: t('log.playlistSkipped', { name: playlist.name }),
      status: LOG_STATUS.SKIPPED,
    });
    return;
  }

  let targetUri: string;

  if (resolution === CONFLICT_RESOLUTION.MERGE && existingUri) {
    targetUri = existingUri;
  } else {
    const result = await Spicetify.Platform.RootlistAPI.createPlaylist(playlist.name, {
      before: 'end',
    });
    targetUri = typeof result === 'string' ? result : (result?.uri ?? '');
    if (!targetUri) {
      log.push({
        label: t('log.playlistFailed', { name: playlist.name }),
        status: LOG_STATUS.ERROR,
      });
      return;
    }
    onCreated(targetUri);
  }

  if (playlist.description) {
    try {
      const description =
        new DOMParser().parseFromString(playlist.description, 'text/html').body.textContent ??
        playlist.description;
      await Spicetify.Platform.PlaylistAPI.updateDetails(targetUri, { description });
    } catch (e) {
      console.warn(`[${__APP_NAME__}] Failed to set description:`, e);
      log.push({
        label: t('log.descriptionFailed', { name: playlist.name }),
        status: LOG_STATUS.SKIPPED,
      });
    }
  }

  let localCount = 0;
  let episodesWithoutUri = 0;
  let trackUris: string[] = [];
  playlist.items.forEach(({ track, episode, localTrack }) => {
    const uri = track?.trackUri ?? episode?.episodeUri;
    if (localTrack) localCount++;
    if (uri) trackUris.push(uri);
    else if (episode) episodesWithoutUri++;
  });

  if (localCount > 0)
    log.push({
      label: t('log.localSkipped', { name: playlist.name, count: localCount }),
      status: LOG_STATUS.SKIPPED,
    });
  if (episodesWithoutUri > 0)
    log.push({
      label: t('log.episodesNoUri', { name: playlist.name, count: episodesWithoutUri }),
      status: LOG_STATUS.SKIPPED,
    });

  // On merge, filter out tracks already in the playlist to avoid duplicates.
  if (resolution === CONFLICT_RESOLUTION.MERGE && trackUris.length > 0) {
    const detail = await Spicetify.Platform.PlaylistAPI.getPlaylist(targetUri);

    if (!detail || detail.error || !detail.contents) {
      log.push({
        label: t('log.mergeReadFailed', { name: playlist.name }),
        status: LOG_STATUS.SKIPPED,
      });
    } else {
      const items = detail.contents.items ?? [];

      if (items.length > 0) {
        const existing = new Set(items.map((i) => i.uri));
        const before = trackUris.length;
        trackUris = trackUris.filter((uri) => !existing.has(uri));
        const dupes = before - trackUris.length;
        if (dupes > 0)
          log.push({
            label: t('log.duplicatesSkipped', { name: playlist.name, count: dupes }),
            status: LOG_STATUS.SKIPPED,
          });
      }
    }
  }

  const logKey =
    resolution === CONFLICT_RESOLUTION.MERGE ? 'log.playlistMerged' : 'log.playlistCreated';
  let added = 0;
  try {
    await batchedWrite(
      trackUris,
      async (batch) => {
        await Spicetify.Platform.PlaylistAPI.add(targetUri, batch, { after: 'end' });
        added += batch.length;
      },
      {
        label: t('progress.importingPlaylist', { name: playlist.name }),
        signal,
        onProgress,
      },
    );
  } finally {
    log.push({ label: t(logKey, { name: playlist.name, count: added }), status: LOG_STATUS.OK });
  }
}

export async function importData(
  data: ExportData,
  selected: Set<DataType>,
  conflictResolutions: Map<number, PlaylistConflictResolution>,
  existingPlaylistUris: Map<string, string>,
  onProgress: (p: ProgressInfo) => void,
  signal: AbortSignal,
  newestFirst = false,
): Promise<ImportResult> {
  const warnings: string[] = [];
  const log: ImportLogEntry[] = [];
  const allTracks = data.library?.tracks;
  const tracks = allTracks?.filter((tr) => tr.uri.startsWith(SPOTIFY_URI.TRACK));
  const localCount = (allTracks?.length ?? 0) - (tracks?.length ?? 0);
  if (localCount > 0)
    log.push({ label: t('log.localTracks', { count: localCount }), status: LOG_STATUS.SKIPPED });

  const tryWrite = async (label: string, fn: () => Promise<void>): Promise<void> => {
    try {
      await fn();
    } catch (e) {
      if (signal.aborted) return;
      const detail = e instanceof Error ? e.message : String(e);
      const msg = t('log.failed', { label });
      log.push({ label, status: LOG_STATUS.ERROR, detail });
      warnings.push(msg);
      notifyError(e, msg);
    }
  };

  const libraryImports: {
    type: DataType;
    items?: { uri: string }[];
    noun: string;
    progressLabel: string;
  }[] = [
    {
      type: DATA_TYPE.LIKED_SONGS,
      items: tracks,
      noun: t('dataType.likedSongs'),
      progressLabel: t('progress.savingLikedSongs'),
    },
    {
      type: DATA_TYPE.ARTISTS,
      items: data.library?.artists,
      noun: t('dataType.artists'),
      progressLabel: t('progress.followingArtists'),
    },
    {
      type: DATA_TYPE.SHOWS,
      items: data.library?.shows,
      noun: t('dataType.shows'),
      progressLabel: t('progress.savingShows'),
    },
    {
      type: DATA_TYPE.ALBUMS,
      items: data.library?.albums,
      noun: t('dataType.albums'),
      progressLabel: t('progress.savingAlbums'),
    },
    {
      type: DATA_TYPE.EPISODES,
      items: data.library?.episodes,
      noun: t('dataType.episodes'),
      progressLabel: t('progress.savingEpisodes'),
    },
  ];

  for (const { type, items, noun, progressLabel } of libraryImports) {
    if (!selected.has(type) || !items?.length) continue;
    const uris = items.map((i) => i.uri).filter(Boolean);
    if (!uris.length) continue;
    // Batches are timestamped as they land, so oldest first keeps "Recently added" in order.
    if (newestFirst && type === DATA_TYPE.LIKED_SONGS) uris.reverse();
    let saved = 0;
    await tryWrite(noun, () =>
      batchedWrite(
        uris,
        async (batch) => {
          await Spicetify.Platform.LibraryAPI.add({ uris: batch });
          saved += batch.length;
        },
        { label: progressLabel, signal, onProgress },
      ),
    );
    if (saved) log.push({ label: t('log.saved', { count: saved, noun }), status: LOG_STATUS.OK });
  }

  if (selected.has(DATA_TYPE.BANNED_CONTENT) && !signal.aborted) {
    const noun = t('dataType.bannedContent');
    const bannedTracks = data.library?.bannedTracks;
    const bannedArtists = data.library?.bannedArtists;
    const excludedFromTaste = data.library?.excludedFromTaste;
    onProgress({ current: 0, total: 0, label: t('progress.banningContent') });

    const banSets: [typeof bannedTracks, string][] = [
      [bannedArtists, BAN_SET.ARTISTS],
      [bannedTracks, BAN_SET.TRACKS],
      [excludedFromTaste, BAN_SET.TASTE],
    ];
    for (const [items, set] of banSets) {
      if (!items?.length) continue;
      let saved = 0;
      await tryWrite(noun, () =>
        batchedWrite(
          items.map((i) => i.uri),
          async (batch) => {
            await Spicetify.Platform.CollectionPlatformAPI.add(set, batch);
            saved += batch.length;
          },
          { label: t('progress.banningContent'), signal, onProgress },
        ),
      );
      if (saved) log.push({ label: t('log.saved', { count: saved, noun }), status: LOG_STATUS.OK });
    }
  }

  const privatePlaylists: { uri: string; name: string }[] = [];

  if (selected.has(DATA_TYPE.PLAYLISTS) && data.playlists?.length) {
    for (let i = 0; i < data.playlists.length; i++) {
      if (signal.aborted) break;

      const playlist = data.playlists[i];
      onProgress({
        current: i + 1,
        total: data.playlists.length,
        label: t('progress.importingPlaylist', { name: playlist.name }),
      });

      try {
        await importPlaylist(
          playlist,
          conflictResolutions.get(i),
          existingPlaylistUris.get(playlist.name),
          log,
          onProgress,
          signal,
          (uri) => privatePlaylists.push({ uri, name: playlist.name }),
        );
      } catch (e) {
        if (signal.aborted) break;
        const detail = e instanceof Error ? e.message : String(e);
        const msg = t('log.failed', { label: playlist.name });
        log.push({ label: playlist.name, status: LOG_STATUS.ERROR, detail });
        warnings.push(msg);
        notifyError(e, msg);
      }
    }
  }

  // Spotify's backend overwrites permissions set immediately after track addition.
  // Wait briefly so the last playlist's tracks have time to settle before we lock them.
  if (privatePlaylists.length > 0) {
    await sleep(PERMISSION_SETTLE_MS);
    for (const { uri, name } of privatePlaylists) {
      try {
        await Spicetify.Platform.PlaylistPermissionsAPI.setBasePermission(uri, 'BLOCKED');
      } catch (e) {
        console.warn(`[${__APP_NAME__}] Failed to set permissions:`, e);
        log.push({ label: t('log.permissionFailed', { name }), status: LOG_STATUS.SKIPPED });
      }
    }
  }

  if (signal.aborted)
    warnings.push(
      t(log.some((e) => e.status === LOG_STATUS.OK) ? 'warn.cancelled' : 'warn.cancelledEmpty'),
    );
  return { log, warnings, cancelled: signal.aborted };
}
