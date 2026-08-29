import { t } from '../i18n';
import type { MusicGraph } from '../graph/music-graph';
import { NODE_TYPE, EDGE_TYPE, LIKED_SONGS_URI } from '../constants';

export const addLikedSongs = (graph: MusicGraph, ownerUri: string): void => {
  graph.addNode({ uri: LIKED_SONGS_URI, type: NODE_TYPE.PLAYLIST, label: t('graph.likedSongs') });
  graph.addEdge(ownerUri, LIKED_SONGS_URI, EDGE_TYPE.OWNS);
};

/**
 * Its name is the one label in the graph that is UI copy rather than Spotify data, so it is
 * re-applied on every load instead of trusted from a snapshot written in another locale.
 */
export const nameLikedSongs = (graph: MusicGraph): void => {
  const node = graph.node(LIKED_SONGS_URI);
  if (node) node.label = t('graph.likedSongs');
};
