import { t } from '../i18n';
import type { ProgressInfo } from '@shared/types';
import { batchedWrite, getPlaylist } from '@shared/api';
import { sleep, SPOTIFY_URI, notifyError, errorMessage } from '@shared/lib';
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
    const detail = await getPlaylist(targetUri);

    if (!detail?.contents) {
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
  } catch (e) {
    // a cancel keeps what already landed
    if (!signal.aborted || !added) throw e;
  }
  log.push({ label: t(logKey, { name: playlist.name, count: added }), status: LOG_STATUS.OK });
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
      const msg = t('log.failed', { label });
      log.push({ label, status: LOG_STATUS.ERROR, detail: errorMessage(e) });
      warnings.push(msg);
      notifyError(e, msg);
    }
  };

  const addToLibrary = (uris: string[]) => Spicetify.Platform.LibraryAPI.add({ uris });
  const ban = (set: string) => (uris: string[]) =>
    Spicetify.Platform.CollectionPlatformAPI.add(set, uris);
  const banned = {
    type: DATA_TYPE.BANNED_CONTENT,
    noun: t('dataType.bannedContent'),
    progressLabel: t('progress.banningContent'),
  };

  const libraryImports: {
    type: DataType;
    items?: { uri: string }[];
    noun: string;
    progressLabel: string;
    write: (uris: string[]) => Promise<unknown>;
  }[] = [
    {
      type: DATA_TYPE.LIKED_SONGS,
      items: tracks,
      noun: t('dataType.likedSongs'),
      progressLabel: t('progress.savingLikedSongs'),
      write: addToLibrary,
    },
    {
      type: DATA_TYPE.ARTISTS,
      items: data.library?.artists,
      noun: t('dataType.artists'),
      progressLabel: t('progress.followingArtists'),
      write: addToLibrary,
    },
    {
      type: DATA_TYPE.SHOWS,
      items: data.library?.shows,
      noun: t('dataType.shows'),
      progressLabel: t('progress.savingShows'),
      write: addToLibrary,
    },
    {
      type: DATA_TYPE.ALBUMS,
      items: data.library?.albums,
      noun: t('dataType.albums'),
      progressLabel: t('progress.savingAlbums'),
      write: addToLibrary,
    },
    {
      type: DATA_TYPE.EPISODES,
      items: data.library?.episodes,
      noun: t('dataType.episodes'),
      progressLabel: t('progress.savingEpisodes'),
      write: addToLibrary,
    },
    { ...banned, items: data.library?.bannedArtists, write: ban(BAN_SET.ARTISTS) },
    { ...banned, items: data.library?.bannedTracks, write: ban(BAN_SET.TRACKS) },
    { ...banned, items: data.library?.excludedFromTaste, write: ban(BAN_SET.TASTE) },
  ];

  for (const { type, items, noun, progressLabel, write } of libraryImports) {
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
          await write(batch);
          saved += batch.length;
        },
        { label: progressLabel, signal, onProgress },
      ),
    );
    if (saved) log.push({ label: t('log.saved', { count: saved, noun }), status: LOG_STATUS.OK });
  }

  const privatePlaylists: { uri: string; name: string }[] = [];

  const playlists = selected.has(DATA_TYPE.PLAYLISTS) ? (data.playlists ?? []) : [];
  for (const [i, playlist] of playlists.entries()) {
    if (signal.aborted) break;
    onProgress({
      current: i + 1,
      total: playlists.length,
      label: t('progress.importingPlaylist', { name: playlist.name }),
    });
    await tryWrite(playlist.name, () =>
      importPlaylist(
        playlist,
        conflictResolutions.get(i),
        existingPlaylistUris.get(playlist.name),
        log,
        onProgress,
        signal,
        (uri) => privatePlaylists.push({ uri, name: playlist.name }),
      ),
    );
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
