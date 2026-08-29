import { paginate } from '@shared/api';
import type { LibraryTrackItem } from '@shared/types';
import type { MusicGraph } from '../graph/music-graph';
import type { NodeType, GraphNode } from '../types/graph';
import { NODE_TYPE, EDGE_TYPE, LIKED_SONGS_URI } from '../constants';
import { parseAlbumTracks, parseArtistOverview } from './graphql-enrichment';
import {
  ingestTrack,
  ingestAlbum,
  ingestArtists,
  ingestAlbumTrack,
  ingestPlaylistTracks,
} from './ingest';

type Expander = (graph: MusicGraph, node: GraphNode, signal?: AbortSignal) => Promise<void>;

const graphqlQuery = (name: Spicetify.GraphQL.Query, variables: Record<string, unknown>) =>
  Spicetify.GraphQL.Request(Spicetify.GraphQL.Definitions[name], variables);

const expandPlaylist: Expander = async (graph, node, signal) => {
  const detail = await Spicetify.Platform.PlaylistAPI.getPlaylist(node.uri);
  signal?.throwIfAborted();
  ingestPlaylistTracks(graph, node.uri, detail?.contents?.items ?? []);
};

const expandArtist: Expander = async (graph, node, signal) => {
  const raw = await graphqlQuery('queryArtistOverview', { uri: node.uri, locale: '' });
  signal?.throwIfAborted();
  const { related, albums } = parseArtistOverview(raw);
  ingestArtists(graph, node.uri, EDGE_TYPE.RELATED_TO, related);
  for (const album of albums) ingestAlbum(graph, node.uri, album);
};

const expandAlbum: Expander = async (graph, node, signal) => {
  const raw = await graphqlQuery('getAlbum', { uri: node.uri, locale: '', offset: 0, limit: 50 });
  signal?.throwIfAborted();
  for (const track of parseAlbumTracks(raw).tracks) ingestAlbumTrack(graph, node.uri, track);
};

// Liked Songs is a playlist the PlaylistAPI cannot read; its contents come from the library.
const expandLikedSongs: Expander = async (graph, node, signal) => {
  const tracks = await paginate<LibraryTrackItem>(
    (p) => Spicetify.Platform.LibraryAPI.getTracks(p),
    { context: 'LibraryAPI.getTracks', signal },
  );
  for (const track of tracks) {
    ingestTrack(graph, track);
    graph.addEdge(node.uri, track.uri, EDGE_TYPE.CONTAINS);
  }
};

const BY_TYPE: Partial<Record<NodeType, Expander>> = {
  [NODE_TYPE.PLAYLIST]: expandPlaylist,
  [NODE_TYPE.ARTIST]: expandArtist,
  [NODE_TYPE.ALBUM]: expandAlbum,
};

const BY_URI: Record<string, Expander> = { [LIKED_SONGS_URI]: expandLikedSongs };

const expanderFor = (node: GraphNode): Expander | undefined =>
  BY_URI[node.uri] ?? BY_TYPE[node.type];

export const canExpand = (node: GraphNode): boolean => expanderFor(node) !== undefined;

export const expandNode = (
  graph: MusicGraph,
  node: GraphNode,
  signal?: AbortSignal,
): Promise<void> => expanderFor(node)?.(graph, node, signal) ?? Promise.resolve();
