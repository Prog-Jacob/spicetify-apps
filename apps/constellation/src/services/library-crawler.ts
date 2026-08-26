import { spotifyImageUrl } from '@shared/lib';
import { MusicGraph } from '../graph/music-graph';
import { NODE_TYPE, EDGE_TYPE } from '../constants';
import { ingestArtists, ingestTrack } from './ingest';
import { paginate, fetchRootlistPlaylists } from '@shared/api';
import type { SpotifyImage, LibraryTrackItem, LibraryContentItem } from '@shared/types';

// Graph topology plus the artwork the crawl already carries. LibraryAPI returns artwork inline,
// so avatars are populated here for free rather than waiting on per-node oEmbed. Images ride
// alongside rather than on the domain nodes.
export type LibraryGraph = { graph: MusicGraph; images: Map<string, string> };

const rememberImage = (images: Map<string, string>, uri: string, list?: SpotifyImage[]): void => {
  if (images.has(uri)) return;
  const url = spotifyImageUrl(list?.[0]?.url);
  if (url) images.set(uri, url);
};

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
    rememberImage(images, playlist.uri, playlist.images);
  }

  for (const item of contents) {
    if (item.type === NODE_TYPE.ARTIST) {
      graph.addNode({
        uri: item.uri,
        type: NODE_TYPE.ARTIST,
        label: item.name,
        addedAt: item.addedAt,
      });
      graph.addEdge(userUri, item.uri, EDGE_TYPE.SAVED);
      rememberImage(images, item.uri, item.images);
    } else if (item.type === NODE_TYPE.ALBUM) {
      graph.addNode({
        uri: item.uri,
        type: NODE_TYPE.ALBUM,
        label: item.name,
        addedAt: item.addedAt,
      });
      graph.addEdge(userUri, item.uri, EDGE_TYPE.SAVED);
      ingestArtists(graph, item.uri, EDGE_TYPE.MADE_BY, item.artists);
      rememberImage(images, item.uri, item.images);
    }
  }

  for (const track of tracks) {
    ingestTrack(graph, track);
    graph.addEdge(userUri, track.uri, EDGE_TYPE.SAVED);
    rememberImage(images, track.uri, track.album?.images);
    if (track.album?.uri) rememberImage(images, track.album.uri, track.album.images);
  }

  return { graph, images };
}
