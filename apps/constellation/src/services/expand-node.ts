import { NODE_TYPE, EDGE_TYPE } from '../constants';
import type { NodeType, GraphNode } from '../types';
import type { MusicGraph } from '../graph/music-graph';
import { parseAlbumTracks, parseArtistOverview } from './graphql-enrichment';
import { ingestArtists, ingestAlbum, ingestAlbumTrack, ingestPlaylistTracks } from './ingest';

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

const EXPANDERS: Partial<Record<NodeType, Expander>> = {
  [NODE_TYPE.PLAYLIST]: expandPlaylist,
  [NODE_TYPE.ARTIST]: expandArtist,
  [NODE_TYPE.ALBUM]: expandAlbum,
};

const EXPANDABLE = new Set<NodeType>(Object.keys(EXPANDERS) as NodeType[]);

export const canExpand = (type: NodeType): boolean => EXPANDABLE.has(type);

export const expandNode = (
  graph: MusicGraph,
  node: GraphNode,
  signal?: AbortSignal,
): Promise<void> => EXPANDERS[node.type]?.(graph, node, signal) ?? Promise.resolve();
