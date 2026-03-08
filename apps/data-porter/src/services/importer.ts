import { t } from '../i18n';
import type { ProgressInfo } from '@shared/types';
import { SPOTIFY_URI, notifyError } from '@shared/lib';
import { DATA_TYPE, LOG_STATUS, CONFLICT_RESOLUTION } from '../constants';
import type { DataType, ExportData, ExportedPlaylist } from '../types/export';
import type { ImportLogEntry, ImportResult, PlaylistConflictResolution } from '../types/import';
import {
  platform,
  checkAborted,
  batchedWrite,
  PLAYLIST_POSITION,
  PLAYLIST_PERMISSION,
} from '@shared/api';

async function importPlaylist(
  playlist: ExportedPlaylist,
  resolution: PlaylistConflictResolution | undefined,
  existingUri: string | undefined,
  log: ImportLogEntry[],
  onProgress: (p: ProgressInfo) => void,
  signal: AbortSignal,
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
    const result = await platform.RootlistAPI.createPlaylist(playlist.name, {
      before: PLAYLIST_POSITION.START,
    });
    targetUri = typeof result === 'string' ? result : (result?.uri ?? '');
    if (!targetUri) {
      log.push({
        label: t('log.playlistFailed', { name: playlist.name }),
        status: LOG_STATUS.ERROR,
      });
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
    const detail = await platform.PlaylistAPI.getPlaylist(targetUri);

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

  if (trackUris.length > 0) {
    await batchedWrite(
      trackUris,
      (batch) => platform.PlaylistAPI.add(targetUri, batch, { after: PLAYLIST_POSITION.END }),
      {
        label: t('progress.importingPlaylist', { name: playlist.name }),
        signal,
        onProgress,
      },
    );
  }

  if (resolution !== CONFLICT_RESOLUTION.MERGE) {
    try {
      await platform.PlaylistPermissionsAPI.setBasePermission(
        targetUri,
        PLAYLIST_PERMISSION.BLOCKED,
      );
    } catch (e) {
      console.warn(`[${__APP_NAME__}] Failed to set permissions:`, e);
      log.push({
        label: t('log.permissionFailed', { name: playlist.name }),
        status: LOG_STATUS.SKIPPED,
      });
    }
  }

  const logKey =
    resolution === CONFLICT_RESOLUTION.MERGE ? 'log.playlistMerged' : 'log.playlistCreated';
  log.push({
    label: t(logKey, { name: playlist.name, count: trackUris.length }),
    status: LOG_STATUS.OK,
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
  const allTracks = data.library?.tracks;
  const tracks = allTracks?.filter((tr) => tr.uri.startsWith(SPOTIFY_URI.TRACK));
  const localCount = (allTracks?.length ?? 0) - (tracks?.length ?? 0);
  if (localCount > 0)
    log.push({ label: t('log.localTracks', { count: localCount }), status: LOG_STATUS.SKIPPED });

  const tryWrite = async (label: string, fn: () => Promise<void>): Promise<void> => {
    try {
      await fn();
    } catch (e) {
      checkAborted(signal);
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

  await Promise.all(
    libraryImports.flatMap(({ type, items, noun, progressLabel }) => {
      if (!selected.has(type) || !items?.length) return [];
      const uris = items.map((i) => i.uri);
      return tryWrite(noun, async () => {
        await batchedWrite(uris, (batch) => platform.LibraryAPI.add({ uris: batch }), {
          label: progressLabel,
          signal,
          onProgress,
        });
        log.push({ label: t('log.saved', { count: uris.length, noun }), status: LOG_STATUS.OK });
      });
    }),
  );

  if (selected.has(DATA_TYPE.BANNED_CONTENT)) {
    const noun = t('dataType.bannedContent');
    const bannedTracks = data.library?.bannedTracks;
    const bannedArtists = data.library?.bannedArtists;
    onProgress({ current: 0, total: 0, label: t('progress.banningContent') });

    const banSets: [typeof bannedTracks, string][] = [
      [bannedTracks, 'notinterested'],
      [bannedArtists, 'artistban'],
    ];
    for (const [items, set] of banSets) {
      if (!items?.length) continue;
      await tryWrite(noun, async () => {
        const uris = items.map((i) => i.uri);
        await batchedWrite(uris, (batch) => platform.CollectionPlatformAPI.add(set, batch), {
          label: t('progress.banningContent'),
          signal,
          onProgress,
        });
        log.push({ label: t('log.saved', { count: uris.length, noun }), status: LOG_STATUS.OK });
      });
    }
  }

  if (selected.has(DATA_TYPE.PLAYLISTS) && data.playlists?.length) {
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
