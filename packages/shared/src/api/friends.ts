export type Friend = { uri: string; name: string; imageUrl?: string };

export async function listFriends(): Promise<Friend[]> {
  try {
    const feed = await Spicetify.Platform.BuddyFeedAPI?.fetchFriendActivity();
    const seen = new Set<string>();
    const friends: Friend[] = [];
    for (const { user } of feed?.friends ?? []) {
      if (!user?.uri || seen.has(user.uri)) continue;
      seen.add(user.uri);
      friends.push({ uri: user.uri, name: user.name ?? user.uri, imageUrl: user.imageUrl });
    }
    return friends;
  } catch {
    return [];
  }
}
