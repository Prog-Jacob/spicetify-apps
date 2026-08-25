import { SPOTIFY_URI } from '@shared/lib';
import { NODE_TYPE, EDGE_TYPE } from '../constants';
import type { MusicGraph } from '../graph/music-graph';
import type { EdgeType, EntityRef, TrackRef } from '../types';
import type { LibraryTrackItem, PlaylistItemDetail } from '@shared/types';

// Shared by the initial crawl and every expander, so entity→node/edge mapping never forks.
export const ingestArtists = (
  graph: MusicGraph,
  from: string,
  edge: EdgeType,
  artists: EntityRef[] = [],
): void => {
  for (const artist of artists) {
    graph.addNode({ uri: artist.uri, type: NODE_TYPE.ARTIST, label: artist.name });
    graph.addEdge(from, artist.uri, edge);
  }
};

export const ingestAlbum = (graph: MusicGraph, artistUri: string, album: EntityRef): void => {
  graph.addNode({ uri: album.uri, type: NODE_TYPE.ALBUM, label: album.name });
  graph.addEdge(album.uri, artistUri, EDGE_TYPE.MADE_BY);
};

export const ingestAlbumTrack = (graph: MusicGraph, albumUri: string, track: TrackRef): void => {
  graph.addNode({ uri: track.uri, type: NODE_TYPE.TRACK, label: track.name });
  graph.addEdge(track.uri, albumUri, EDGE_TYPE.ON_ALBUM);
  ingestArtists(graph, track.uri, EDGE_TYPE.PERFORMED_BY, track.artists);
};

export const ingestTrack = (graph: MusicGraph, track: LibraryTrackItem): void => {
  graph.addNode({
    uri: track.uri,
    type: NODE_TYPE.TRACK,
    label: track.name,
    addedAt: track.addedAt,
  });
  if (track.album?.uri) {
    graph.addNode({ uri: track.album.uri, type: NODE_TYPE.ALBUM, label: track.album.name });
    graph.addEdge(track.uri, track.album.uri, EDGE_TYPE.ON_ALBUM);
  }
  ingestArtists(graph, track.uri, EDGE_TYPE.PERFORMED_BY, track.artists);
};

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
