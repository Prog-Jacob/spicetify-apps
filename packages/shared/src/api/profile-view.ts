import { cosmos } from './cosmos';

/**
 * Client for Spotify's internal `user-profile-view` endpoint: a user's public profile, playlists,
 * and social graph. The URL shape and JSON belong here once, not re-modeled in every app that
 * reads a profile (constellation's graph, data-porter's export, the friends picker).
 */
const BASE = 'https://spclient.wg.spotify.com/user-profile-view/v3/profile';
const MARKET = 'market=from_token';

export type ProfileEntry = { uri: string; name?: string; image_url?: string };
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
