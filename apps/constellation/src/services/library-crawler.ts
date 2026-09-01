import { t } from '../i18n';
import { ingestArtists } from './ingest';
import { addLikedSongs } from './liked-songs';
import { MusicGraph } from '../graph/music-graph';
import { rememberFirstImage } from './node-images';
import { NODE_TYPE, EDGE_TYPE } from '../constants';
import { notifyError, toEpochMs } from '@shared/lib';
import { attachUserPlaylists } from './user-playlists';
import type { LibraryContentItem } from '@shared/types';
import { paginate, fetchRootlistPlaylists } from '@shared/api';
import { listSocialGraph, type ProfileRef } from './social-graph';

export type LibraryGraph = {
  graph: MusicGraph;
  images: Map<string, string>;
  /** Your own node: what the rest of the graph hangs off, and what a prune measures from. */
  rootUri: string;
  expanded: Set<string>;
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
      return { following: [], followers: [] };
    }),
  ]);

  const userUri = user.uri ?? 'spotify:user:me';
  graph.addNode({
    uri: userUri,
    type: NODE_TYPE.USER,
    label: user.displayName ?? user.name ?? t('graph.you'),
  });
  if (user.imageUrl) images.set(userUri, user.imageUrl);

  const people = new Map<string, ProfileRef>();
  for (const person of [...social.following, ...social.followers]) {
    if (person.uri !== userUri) people.set(person.uri, person);
  }
  for (const person of people.values()) {
    graph.addNode({ uri: person.uri, type: NODE_TYPE.USER, label: person.name });
    if (person.imageUrl) images.set(person.uri, person.imageUrl);
  }
  for (const person of social.following) graph.addEdge(userUri, person.uri, EDGE_TYPE.FOLLOWS);
  for (const person of social.followers) graph.addEdge(person.uri, userUri, EDGE_TYPE.FOLLOWS);

  for (const playlist of playlists) {
    graph.addNode({ uri: playlist.uri, type: NODE_TYPE.PLAYLIST, label: playlist.name });
    graph.addEdge(userUri, playlist.uri, EDGE_TYPE.OWNS);
    rememberFirstImage(images, playlist.uri, playlist.images);
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
      rememberFirstImage(images, item.uri, item.images);
    } else if (item.type === NODE_TYPE.ALBUM) {
      graph.addNode({
        uri: item.uri,
        type: NODE_TYPE.ALBUM,
        label: item.name,
        addedAt: toEpochMs(item.addedAt),
      });
      graph.addEdge(userUri, item.uri, EDGE_TYPE.SAVED);
      ingestArtists(graph, item.uri, EDGE_TYPE.MADE_BY, item.artists);
      rememberFirstImage(images, item.uri, item.images);
    }
  }

  addLikedSongs(graph, userUri);

  const profiles = [...people.keys()];
  onProgress?.({ stage: 'profiles', done: 0, total: profiles.length });
  for (let i = 0; i < profiles.length; i += FRIEND_PLAYLIST_CONCURRENCY) {
    signal?.throwIfAborted();
    const chunk = profiles.slice(i, i + FRIEND_PLAYLIST_CONCURRENCY);
    await Promise.all(
      chunk.map((uri) => attachUserPlaylists(graph, images, uri, signal).catch(() => undefined)),
    );
    onProgress?.({ stage: 'profiles', done: i + chunk.length, total: profiles.length });
  }

  return { graph, images, rootUri: userUri, expanded: new Set<string>() };
}
