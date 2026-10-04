import { t } from '../i18n';
import { addLikedSongs } from './liked-songs';
import { MusicGraph } from '../graph/music-graph';
import { NODE_TYPE, EDGE_TYPE } from '../constants';
import { attachUserPlaylists } from './user-playlists';
import { ingestArtists, rememberImage } from './ingest';
import type { LibraryContentItem } from '@shared/types';
import { notifyError, toEpochMs, firstImageUrl, mapLimit } from '@shared/lib';
import { paginate, fetchRootlistPlaylists, listSocialGraph } from '@shared/api';

export type LibraryGraph = {
  graph: MusicGraph;
  images: Map<string, string>;
  /** Your own node: what the rest of the graph hangs off, and what a prune measures from. */
  rootUri: string;
  expanded: Set<string>;
  /** When the library was last read from Spotify; expanding or adding does not refresh it. */
  crawledAt?: number;
};

const FRIEND_PLAYLIST_CONCURRENCY = 5;

export type CrawlPhase = { stage: 'library' | 'profiles'; done?: number; total?: number };
type CrawlProgress = (phase: CrawlPhase) => void;

// Tier A only: proven, rate-limit-free Platform APIs, plus the edges saved objects carry.
export async function buildLibraryGraph(
  signal?: AbortSignal,
  onProgress?: CrawlProgress,
): Promise<LibraryGraph> {
  const graph = new MusicGraph();
  const images = new Map<string, string>();
  onProgress?.({ stage: 'library' });

  const [user, [contents, playlists], social] = await Promise.all([
    Spicetify.Platform.UserAPI.getUser(),
    Promise.all([
      paginate<LibraryContentItem>((p) => Spicetify.Platform.LibraryAPI.getContents(p), {
        context: 'LibraryAPI.getContents',
        signal,
      }),
      fetchRootlistPlaylists(signal).catch((e: unknown) => {
        notifyError(e, t('app.playlistsFailed'));
        return [];
      }),
    ]),
    listSocialGraph().catch((e: unknown) => {
      notifyError(e, t('app.friendsFailed'));
      return { following: [], followers: [], friends: [] };
    }),
  ]);

  const userUri = user.uri ?? 'spotify:user:me';
  graph.addNode({
    uri: userUri,
    type: NODE_TYPE.USER,
    label: user.displayName ?? user.name ?? t('graph.you'),
  });
  rememberImage(images, userUri, user.imageUrl);

  const people = social.friends.filter((person) => person.uri !== userUri);
  for (const person of people) {
    graph.addNode({ uri: person.uri, type: NODE_TYPE.USER, label: person.name });
    rememberImage(images, person.uri, person.imageUrl);
  }
  for (const person of social.following) graph.addEdge(userUri, person.uri, EDGE_TYPE.FOLLOWS);
  for (const person of social.followers) graph.addEdge(person.uri, userUri, EDGE_TYPE.FOLLOWS);

  for (const playlist of playlists) {
    graph.addNode({ uri: playlist.uri, type: NODE_TYPE.PLAYLIST, label: playlist.name });
    graph.addEdge(userUri, playlist.uri, EDGE_TYPE.OWNS);
    rememberImage(images, playlist.uri, firstImageUrl(playlist.images));
  }

  for (const item of contents) {
    if (item.type === NODE_TYPE.ARTIST) {
      graph.addNode({
        uri: item.uri,
        type: NODE_TYPE.ARTIST,
        label: item.name,
        addedAt: toEpochMs(item.addedAt),
      });
      graph.addEdge(userUri, item.uri, EDGE_TYPE.SAVED);
      rememberImage(images, item.uri, firstImageUrl(item.images));
    } else if (item.type === NODE_TYPE.ALBUM) {
      graph.addNode({
        uri: item.uri,
        type: NODE_TYPE.ALBUM,
        label: item.name,
        addedAt: toEpochMs(item.addedAt),
      });
      graph.addEdge(userUri, item.uri, EDGE_TYPE.SAVED);
      ingestArtists(graph, item.uri, EDGE_TYPE.MADE_BY, item.artists);
      rememberImage(images, item.uri, firstImageUrl(item.images));
    }
  }

  addLikedSongs(graph, userUri);

  const total = people.length;
  onProgress?.({ stage: 'profiles', done: 0, total });
  await mapLimit(
    people,
    FRIEND_PLAYLIST_CONCURRENCY,
    (person) => attachUserPlaylists(graph, images, person.uri, signal).catch(() => undefined),
    { signal, onDone: (done) => onProgress?.({ stage: 'profiles', done, total }) },
  );
  signal?.throwIfAborted();

  return { graph, images, rootUri: userUri, expanded: new Set<string>(), crawledAt: Date.now() };
}
