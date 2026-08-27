import { getFollowers, getFollowing } from './profile-view';
import { SPOTIFY_URI, spotifyImageUrl } from '../lib/spotify';

export type Friend = { uri: string; name: string; imageUrl?: string };

export async function listFriends(): Promise<Friend[]> {
  const me = await Spicetify.Platform.UserAPI.getUser();
  const id = me?.uri?.split(':').pop();
  if (!id) return [];

  const [followers, following] = await Promise.all([
    getFollowers(id).catch(() => []),
    getFollowing(id).catch(() => []),
  ]);

  const seen = new Set<string>();
  const friends: Friend[] = [];
  for (const entry of [...followers, ...following]) {
    if (!entry.uri?.startsWith(SPOTIFY_URI.USER) || seen.has(entry.uri)) continue;
    seen.add(entry.uri);
    friends.push({
      uri: entry.uri,
      name: entry.name ?? entry.uri,
      imageUrl: spotifyImageUrl(entry.image_url),
    });
  }
  return friends;
}
