import type { EdgeType } from '../types';
import { SPOTIFY_URI } from '@shared/lib';
import { NODE_TYPE, EDGE_TYPE } from '../constants';
import type { MusicGraph } from '../graph/music-graph';
import type { LibraryTrackItem, PlaylistItemDetail } from '@shared/types';

type ArtistRef = { uri: string; name: string };

// Shared by the initial crawl and every expander, so entity→node/edge mapping never forks.
export const ingestArtists = (
  graph: MusicGraph,
  from: string,
  edge: EdgeType,
  artists: ArtistRef[] = [],
): void => {
  for (const artist of artists) {
    graph.addNode({ uri: artist.uri, type: NODE_TYPE.ARTIST, label: artist.name });
    graph.addEdge(from, artist.uri, edge);
  }
};

export const ingestTrack = (graph: MusicGraph, track: LibraryTrackItem): void => {
  graph.addNode({ uri: track.uri, type: NODE_TYPE.TRACK, label: track.name });
  if (track.album?.uri) {
    graph.addNode({ uri: track.album.uri, type: NODE_TYPE.ALBUM, label: track.album.name });
    graph.addEdge(track.uri, track.album.uri, EDGE_TYPE.ON_ALBUM);
  }
  ingestArtists(graph, track.uri, EDGE_TYPE.PERFORMED_BY, track.artists);
};

// Playlist items are thin (no artist/album URIs), so this adds only track nodes and
// playlist→track edges; artist/album links surface when those tracks are saved elsewhere.
export const ingestPlaylistTracks = (
  graph: MusicGraph,
  playlistUri: string,
  items: PlaylistItemDetail[],
): void => {
  for (const item of items) {
    if (!item.uri.startsWith(SPOTIFY_URI.TRACK)) continue;
    graph.addNode({ uri: item.uri, type: NODE_TYPE.TRACK, label: item.name });
    graph.addEdge(playlistUri, item.uri, EDGE_TYPE.CONTAINS);
  }
};
