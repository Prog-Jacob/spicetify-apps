import { t } from '../i18n';
import { DATA_TYPE } from '../constants';
import { userProfileUrl } from './profile-export';
import {
  SPOTIFY_URI,
  notifyError,
  toDateString,
  formatArtists,
  toDateTimeString,
} from '@shared/lib';
import type {
  ProgressInfo,
  LibraryTrackItem,
  LibraryContentItem,
  PlaylistItemDetail,
} from '@shared/types';
import {
  cosmos,
  paginate,
  platform,
  checkAborted,
  BATCH_DELAY_MS,
  PLAYLIST_BATCH_SIZE,
} from '@shared/api';
import {
  emptyLibrary,
  type DataType,
  type ExportData,
  type ExportResult,
  type ExportedPlaylist,
  type ExportedRecentTrack,
  type ExportedPlaylistItem,
  type ExportedRecentPodcast,
} from '../types/export';

function toExportedPlaylistItem(item: PlaylistItemDetail): ExportedPlaylistItem {
  const addedDate = item.addedAt ? toDateString(item.addedAt) : '';
  const base = { track: null, episode: null, localTrack: null, audiobook: null, addedDate };

  if (item.uri.startsWith(SPOTIFY_URI.EPISODE))
    return { ...base, episode: { episodeName: item.name, showName: item.show?.name ?? '' } };

  const trackInfo = {
    trackName: item.name,
    artistName: formatArtists(item.artists),
    albumName: item.album?.name ?? '',
    trackUri: item.uri,
  };

  if (item.uri.startsWith(SPOTIFY_URI.LOCAL)) return { ...base, localTrack: trackInfo };

  return { ...base, track: trackInfo };
}

async function fetchBannedItems(set: string) {
  const result = await platform.CollectionPlatformAPI.get(set);
  return (Array.isArray(result) ? result : []).map(
    ({ uri, name }: { uri: string; name?: string }) => ({ uri, ...(name && { name }) }),
  );
}

async function fetchRecentlyPlayed() {
  const result = await platform.RecentsAPI.getContents();
  const raw = result?.items;
  const music: ExportedRecentTrack[] = [];
  const podcasts: ExportedRecentPodcast[] = [];
  const items = Array.isArray(raw) ? raw : (raw?.items ?? []);

  for (const item of items) {
    const endTime = toDateTimeString(item.playedAt ?? Date.now());
    const uri: string = item.uri ?? '';
    if (uri.startsWith(SPOTIFY_URI.EPISODE)) {
      podcasts.push({
        endTime,
        podcastName: item.showName ?? item.contextName ?? '',
        episodeName: item.name ?? '',
        uri,
      });
    } else {
      music.push({
        endTime,
        artistName: item.artistName ?? formatArtists(item.artists),
        trackName: item.name ?? '',
        uri,
        albumName: item.albumName ?? item.album?.name ?? '',
      });
    }
  }

  return { music, podcasts };
}

async function fetchUserProfile() {
  const user = await platform.UserAPI.getUser();
  const userId = user.username ?? '';
  const enriched = await cosmos
    .get<{ following_count?: number }>(`${userProfileUrl(userId)}?market=from_token`)
    .catch(() => null);
  return {
    displayName: user.displayName ?? user.name ?? '',
    username: userId,
    uri: user.uri ?? '',
    ...(user.imageUrl && { imageUrl: user.imageUrl }),
    ...(enriched?.following_count != null && { followingCount: enriched.following_count }),
  };
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

    const detail = await platform.PlaylistAPI.getPlaylist(row.uri).catch(() => null);
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

  const library = emptyLibrary();

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
        artist: formatArtists(item.artists),
        album: item.album?.name ?? '',
        uri: item.uri,
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

  if (selected.has(DATA_TYPE.EPISODES)) {
    onProgress({ current: 0, total: 0, label: t('progress.fetchingEpisodes') });
    const eps = await tryFetch(t('dataType.episodes'), async () => {
      const detail = await platform.PlaylistAPI.getPlaylist(SPOTIFY_URI.YOUR_EPISODES);
      return ((detail?.contents?.items ?? []) as { name: string; uri: string }[]).map((ep) => ({
        name: ep.name,
        uri: ep.uri,
      }));
    });
    if (eps) library.episodes = eps;
  }

  if (selected.has(DATA_TYPE.BANNED_CONTENT)) {
    onProgress({ current: 0, total: 0, label: t('progress.fetchingBannedContent') });
    const label = t('dataType.bannedContent');
    library.bannedArtists = (await tryFetch(label, () => fetchBannedItems('artistban'))) ?? [];
    library.bannedTracks = (await tryFetch(label, () => fetchBannedItems('notinterested'))) ?? [];
  }

  if (Object.values(library).some((arr) => arr.length > 0)) data.library = library;

  if (selected.has(DATA_TYPE.RECENTLY_PLAYED)) {
    onProgress({ current: 0, total: 0, label: t('progress.fetchingRecentlyPlayed') });
    const recents = await tryFetch(t('dataType.recentlyPlayed'), fetchRecentlyPlayed);
    if (recents) data.recentlyPlayed = recents;
  }
  if (selected.has(DATA_TYPE.PROFILE)) {
    onProgress({ current: 0, total: 0, label: t('progress.fetchingUserProfile') });
    const profile = await tryFetch(t('dataType.profile'), fetchUserProfile);
    if (profile) data.profile = profile;
  }

  return { data, warnings, userName: data.profile?.username };
}
