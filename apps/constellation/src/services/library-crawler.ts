import { MusicGraph } from '../graph/music-graph';
import { NODE_TYPE, EDGE_TYPE } from '../constants';
import { ingestArtists, ingestTrack } from './ingest';
import { paginate, fetchRootlistPlaylists } from '@shared/api';
import type { LibraryTrackItem, LibraryContentItem } from '@shared/types';

// Graph topology plus the artwork we already know (currently the user's avatar, which
// oEmbed can't resolve). Images ride alongside rather than on the domain nodes.
export type LibraryGraph = { graph: MusicGraph; images: Map<string, string> };

// Tier A only: proven, rate-limit-free Platform APIs, plus the edges saved objects carry.
export async function buildLibraryGraph(signal?: AbortSignal): Promise<LibraryGraph> {
  const graph = new MusicGraph();
  const images = new Map<string, string>();

  const [user, [contents, tracks, playlists]] = await Promise.all([
    Spicetify.Platform.UserAPI.getUser(),
    Promise.all([
      paginate<LibraryContentItem>((p) => Spicetify.Platform.LibraryAPI.getContents(p), {
        context: 'LibraryAPI.getContents',
        signal,
      }),
      paginate<LibraryTrackItem>((p) => Spicetify.Platform.LibraryAPI.getTracks(p), {
        context: 'LibraryAPI.getTracks',
        signal,
      }),
      fetchRootlistPlaylists(signal),
    ]),
  ]);

  const userUri = user.uri ?? 'spotify:user:me';
  graph.addNode({
    uri: userUri,
    type: NODE_TYPE.USER,
    label: user.displayName ?? user.name ?? 'You',
  });
  if (user.imageUrl) images.set(userUri, user.imageUrl);

  for (const playlist of playlists) {
    graph.addNode({ uri: playlist.uri, type: NODE_TYPE.PLAYLIST, label: playlist.name });
    graph.addEdge(userUri, playlist.uri, EDGE_TYPE.OWNS);
  }

  for (const item of contents) {
    if (item.type === NODE_TYPE.ARTIST) {
      graph.addNode({ uri: item.uri, type: NODE_TYPE.ARTIST, label: item.name });
      graph.addEdge(userUri, item.uri, EDGE_TYPE.SAVED);
    } else if (item.type === NODE_TYPE.ALBUM) {
      graph.addNode({ uri: item.uri, type: NODE_TYPE.ALBUM, label: item.name });
      graph.addEdge(userUri, item.uri, EDGE_TYPE.SAVED);
      ingestArtists(graph, item.uri, EDGE_TYPE.MADE_BY, item.artists);
    }
  }

  for (const track of tracks) {
    ingestTrack(graph, track);
    graph.addEdge(userUri, track.uri, EDGE_TYPE.SAVED);
  }

  return { graph, images };
}
