import { t } from '../i18n';
import { SPOTIFY_URI } from '@shared/lib';
import { NODE_TYPE, EDGE_TYPE } from '../constants';
import type { MusicGraph } from '../graph/music-graph';

export const addLikedSongs = (graph: MusicGraph, ownerUri: string): void => {
  graph.addNode({
    uri: SPOTIFY_URI.LIKED_SONGS,
    type: NODE_TYPE.PLAYLIST,
    label: t('graph.likedSongs'),
  });
  graph.addEdge(ownerUri, SPOTIFY_URI.LIKED_SONGS, EDGE_TYPE.OWNS);
};

/**
 * Liked Songs' label is UI copy, not Spotify data: re-apply per load so a snapshot saved in
 * another locale doesn't stick.
 */
export const nameLikedSongs = (graph: MusicGraph): void =>
  graph.relabel(SPOTIFY_URI.LIKED_SONGS, t('graph.likedSongs'));
