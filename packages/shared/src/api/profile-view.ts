import { cosmos } from './cosmos';
import { PAGE_SIZE } from './batch';

/**
 * Client for Spotify's internal `user-profile-view` endpoint: a user's public profile, playlists,
 * and social graph.
 */
const BASE = 'https://spclient.wg.spotify.com/user-profile-view/v3/profile';
const MARKET = 'market=from_token';

export type ProfileEntry = { uri?: string; name?: string; image_url?: string };
export type ProfilePlaylist = { uri: string; name: string; image_url?: string };
export type UserProfile = {
  name?: string;
  image_url?: string;
  total_public_playlists_count?: number;
  following_count?: number;
};

const userProfileUrl = (userId: string): string => `${BASE}/${encodeURIComponent(userId)}`;

export const getProfile = (userId: string): Promise<UserProfile> =>
  cosmos.get<UserProfile>(`${userProfileUrl(userId)}?${MARKET}`);

export const getFollowing = async (userId: string): Promise<ProfileEntry[]> =>
  (await cosmos.get<{ profiles?: ProfileEntry[] }>(`${userProfileUrl(userId)}/following?${MARKET}`))
    .profiles ?? [];

export const getFollowers = async (userId: string): Promise<ProfileEntry[]> =>
  (await cosmos.get<{ profiles?: ProfileEntry[] }>(`${userProfileUrl(userId)}/followers?${MARKET}`))
    .profiles ?? [];

export const getPublicPlaylists = async (
  userId: string,
  page: { offset?: number; limit: number },
): Promise<ProfilePlaylist[]> =>
  (
    await cosmos.get<{ public_playlists?: ProfilePlaylist[] }>(
      `${userProfileUrl(userId)}/playlists?offset=${page.offset ?? 0}&limit=${page.limit}&${MARKET}`,
    )
  ).public_playlists ?? [];

type ListOptions = { max?: number; signal?: AbortSignal; onProgress?: (count: number) => void };

/** Every public playlist of a user, page by page, up to `max`. */
export const listPublicPlaylists = async (
  userId: string,
  { max = Infinity, signal, onProgress }: ListOptions = {},
): Promise<ProfilePlaylist[]> => {
  const byUri = new Map<string, ProfilePlaylist>();
  for (let offset = 0; offset < max;) {
    signal?.throwIfAborted();
    const limit = Math.min(PAGE_SIZE, max - offset);
    const page = await getPublicPlaylists(userId, { offset, limit });
    const before = byUri.size;
    for (const playlist of page) byUri.set(playlist.uri, playlist);
    offset += page.length;
    onProgress?.(byUri.size);
    // A short page ends the list; a page of only repeats means the endpoint ignored the offset.
    if (page.length < limit || byUri.size === before) break;
  }
  return [...byUri.values()];
};
