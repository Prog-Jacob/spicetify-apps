import { t } from '../i18n';
import type { MusicGraph } from '../graph/music-graph';
import { NODE_TYPE, EDGE_TYPE, LIKED_SONGS_URI } from '../constants';

export const addLikedSongs = (graph: MusicGraph, ownerUri: string): void => {
  graph.addNode({ uri: LIKED_SONGS_URI, type: NODE_TYPE.PLAYLIST, label: t('graph.likedSongs') });
  graph.addEdge(ownerUri, LIKED_SONGS_URI, EDGE_TYPE.OWNS);
};

/**
 * Liked Songs' label is UI copy, not Spotify data: re-apply per load so a snapshot saved in
 * another locale doesn't stick.
 */
export const nameLikedSongs = (graph: MusicGraph): void =>
  graph.relabel(LIKED_SONGS_URI, t('graph.likedSongs'));
