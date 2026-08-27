import { parseUserId } from '@shared/lib';
import { rememberImage } from './node-images';
import { getPublicPlaylists } from '@shared/api';
import { NODE_TYPE, EDGE_TYPE } from '../constants';
import type { MusicGraph } from '../graph/music-graph';

export const attachUserPlaylists = async (
  graph: MusicGraph,
  images: Map<string, string>,
  userUri: string,
  signal?: AbortSignal,
): Promise<void> => {
  const playlists = await getPublicPlaylists(parseUserId(userUri), { limit: 50 }).catch(() => []);
  signal?.throwIfAborted();
  for (const playlist of playlists) {
    graph.addNode({ uri: playlist.uri, type: NODE_TYPE.PLAYLIST, label: playlist.name });
    graph.addEdge(userUri, playlist.uri, EDGE_TYPE.OWNS);
    rememberImage(images, playlist.uri, playlist.image_url);
  }
};
