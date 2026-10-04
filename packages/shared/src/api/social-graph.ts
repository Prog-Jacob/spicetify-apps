import { SPOTIFY_URI, spotifyImageUrl, parseUserId } from '../lib/spotify';
import { getFollowers, getFollowing, type ProfileEntry } from './profile-view';

export type ProfileRef = { uri: string; name: string; imageUrl?: string };

/** `friends` is everyone in either list, once each. */
type SocialGraph = { following: ProfileRef[]; followers: ProfileRef[]; friends: ProfileRef[] };

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

/** Who you follow and who follows you. Throws only when both lists fail. */
export const listSocialGraph = async (): Promise<SocialGraph> => {
  const me = await Spicetify.Platform.UserAPI.getUser();
  const id = me?.uri ? parseUserId(me.uri) : '';
  if (!id) return { following: [], followers: [], friends: [] };

  const [following, followers] = await Promise.allSettled([getFollowing(id), getFollowers(id)]);
  if (following.status === 'rejected' && followers.status === 'rejected') throw following.reason;

  const out = toProfileRefs(following.status === 'fulfilled' ? following.value : []);
  const ins = toProfileRefs(followers.status === 'fulfilled' ? followers.value : []);
  const friends = [...new Map([...out, ...ins].map((p) => [p.uri, p])).values()];
  return { following: out, followers: ins, friends };
};
