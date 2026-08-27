import { NODE_TYPE } from '../constants';
import type ForceGraph from 'force-graph';
import { loadImage } from '../graph/node-paint';
import { resolveUriMetadata } from '@shared/api';
import type { MusicGraph } from '../graph/music-graph';
import { useEffect, useRef, type RefObject } from 'react';
import type { RenderNode, RenderLink } from '../graph/render-data';

const REPAINT_THROTTLE_MS = 250;

export const useNodeArtwork = (
  graph: MusicGraph,
  images: Map<string, string>,
  revision: number,
  graphRef: RefObject<ForceGraph<RenderNode, RenderLink> | undefined>,
  imageByUri: Map<string, string>,
): void => {
  const attempted = useRef(new Set<string>()).current;
  const repaintPending = useRef(false);

  useEffect(() => {
    const repaint = () => {
      if (repaintPending.current) return;
      repaintPending.current = true;
      setTimeout(() => {
        repaintPending.current = false;
        graphRef.current?.resumeAnimation();
      }, REPAINT_THROTTLE_MS);
    };
    const show = (uri: string, url: string) => {
      if (imageByUri.has(uri)) return;
      imageByUri.set(uri, url);
      loadImage(url, repaint);
    };

    const pending: string[] = [];
    for (const node of graph.nodes()) {
      if (node.type !== NODE_TYPE.TRACK && !imageByUri.has(node.uri) && !attempted.has(node.uri)) {
        attempted.add(node.uri);
        pending.push(node.uri);
      }
    }

    for (const [uri, url] of images) show(uri, url);

    let cancelled = false;
    void resolveUriMetadata(pending).then((metas) => {
      if (cancelled) return;
      for (const [uri, meta] of metas) if (meta.imageUrl) show(uri, meta.imageUrl);
      repaint();
    });

    return () => {
      cancelled = true;
    };
  }, [graph, images, revision, imageByUri, attempted, graphRef]);
};
