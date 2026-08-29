import { SPOTIFY_URI, spotifyImageUrl } from '@shared/lib';
import { getFollowers, getFollowing, type ProfileEntry } from '@shared/api';

export type ProfileRef = { uri: string; name: string; imageUrl?: string };

type SocialGraph = { following: ProfileRef[]; followers: ProfileRef[] };

const toProfileRefs = (entries: ProfileEntry[]): ProfileRef[] => {
  const byUri = new Map<string, ProfileRef>();
  for (const entry of entries) {
    if (!entry.uri?.startsWith(SPOTIFY_URI.USER) || byUri.has(entry.uri)) continue;
    byUri.set(entry.uri, {
      uri: entry.uri,
      name: entry.name ?? entry.uri,
      imageUrl: spotifyImageUrl(entry.image_url),
    });
  }
  return [...byUri.values()];
};

export const listSocialGraph = async (): Promise<SocialGraph> => {
  const me = await Spicetify.Platform.UserAPI.getUser();
  const id = me?.uri?.split(':').pop();
  if (!id) return { following: [], followers: [] };

  const [following, followers] = await Promise.allSettled([getFollowing(id), getFollowers(id)]);
  if (following.status === 'rejected' && followers.status === 'rejected') throw following.reason;

  return {
    following: toProfileRefs(following.status === 'fulfilled' ? following.value : []),
    followers: toProfileRefs(followers.status === 'fulfilled' ? followers.value : []),
  };
};
