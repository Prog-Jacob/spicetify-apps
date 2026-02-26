import { t } from '../i18n';
import { buildPlaylists } from './exporter';
import { parseUserId, ValidationError } from '@shared/lib';
import { cosmos, PAGE_SIZE, checkAborted } from '@shared/api';
import type { ExportResult, ExportedPlaylist } from '../types/export';
import type { ProgressInfo, LibraryContentItem } from '@shared/types';

// Internal Spotify endpoint — not publicly documented, may change across client versions.
const BASE_URL = 'https://spclient.wg.spotify.com/user-profile-view/v3/profile';
const userUrl = (userId: string) => `${BASE_URL}/${encodeURIComponent(userId)}`;

type FollowingResponse = { profiles: { uri: string; name: string }[] };
type UserProfile = { name: string; total_public_playlists_count: number };
type PlaylistsResponse = { public_playlists: { uri: string; name: string }[] };

async function fetchUserPlaylists(
  userId: string,
  total: number,
  onProgress: (p: ProgressInfo) => void,
  signal: AbortSignal,
): Promise<LibraryContentItem[]> {
  const items: LibraryContentItem[] = [];

  for (let offset = 0; offset < total; offset += PAGE_SIZE) {
    checkAborted(signal);
    onProgress({ current: offset, total, label: t('progress.fetchingPlaylistList') });

    const { public_playlists = [] } = await cosmos.get<PlaylistsResponse>(
      `${userUrl(userId)}/playlists?offset=${offset}&limit=${PAGE_SIZE}&market=from_token`,
    );
    items.push(
      ...public_playlists.map((p) => ({ uri: p.uri, name: p.name, type: 'playlist' as const })),
    );
  }

  return items;
}

export async function exportPublicProfile(
  userInput: string,
  onProgress: (progress: ProgressInfo) => void,
  signal: AbortSignal,
): Promise<ExportResult> {
  const warnings: string[] = [];
  const userId = parseUserId(userInput);
  let playlists: ExportedPlaylist[] = [];
  if (!userId) throw new ValidationError(t('error.invalidProfile'));

  checkAborted(signal);
  onProgress({ current: 0, total: 0, label: t('progress.fetchingProfile') });

  const profile = await cosmos.get<UserProfile>(userUrl(userId));

  const { name: userName, total_public_playlists_count } = profile;
  const playlistItems = await fetchUserPlaylists(
    userId,
    total_public_playlists_count,
    onProgress,
    signal,
  );

  if (playlistItems.length > 0) {
    onProgress({ current: 0, total: playlistItems.length, label: t('progress.fetchingPlaylists') });
    const result = await buildPlaylists(playlistItems, onProgress, signal);
    playlists = result.playlists;

    if (result.skipped.length > 0) {
      warnings.push(
        t('warn.playlistsFailed', {
          count: result.skipped.length,
          names: result.skipped.join(', '),
        }),
      );
    }
  }

  checkAborted(signal);
  onProgress({ current: 0, total: 0, label: t('progress.fetchingArtists') });

  const { profiles = [] } = await cosmos.get<FollowingResponse>(
    `${userUrl(userId)}/following?market=from_token`,
  );
  const artists = profiles
    .filter((p) => p.uri.startsWith('spotify:artist:'))
    .map((p) => ({ name: p.name, uri: p.uri }));

  if (!playlists.length && !artists.length) {
    warnings.push(t('warn.noPublicData'));
  }

  return {
    data: {
      ...(playlists.length > 0 && { playlists }),
      ...(artists.length > 0 && { library: { tracks: [], albums: [], artists, shows: [] } }),
    },
    userName: userName || userId,
    warnings,
  };
}
