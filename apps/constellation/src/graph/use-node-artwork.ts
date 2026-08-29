import { NODE_TYPE } from '../constants';
import { loadImage } from './node-paint';
import type { MusicGraph } from './music-graph';
import { resolveUriMetadata } from '@shared/api';
import type { GraphCanvas } from './graph-canvas';
import { useRef, useEffect, useDeferredValue } from 'react';

const REPAINT_THROTTLE_MS = 250;

export const useNodeArtwork = (
  graph: MusicGraph,
  images: Map<string, string>,
  revision: number,
  canvas: GraphCanvas | null,
  imageByUri: Map<string, string>,
): void => {
  const attempted = useRef(new Set<string>()).current;
  const repaintPending = useRef(false);
  const lastGraph = useRef<MusicGraph | null>(null);
  const settledRevision = useDeferredValue(revision);

  useEffect(() => {
    if (!canvas) return;

    if (lastGraph.current !== graph) {
      lastGraph.current = graph;
      const live = new Set(graph.nodes().map((node) => node.uri));
      for (const uri of attempted) if (!live.has(uri)) attempted.delete(uri);
      for (const uri of imageByUri.keys()) if (!live.has(uri)) imageByUri.delete(uri);
    }

    const repaint = () => {
      if (repaintPending.current) return;
      repaintPending.current = true;
      setTimeout(() => {
        repaintPending.current = false;
        canvas?.resume();
      }, REPAINT_THROTTLE_MS);
    };
    const show = (uri: string, url: string) => {
      if (imageByUri.get(uri) === url) return;
      imageByUri.set(uri, url);
      loadImage(url, repaint);
    };

    for (const [uri, url] of images) show(uri, url);

    const pending: string[] = [];
    for (const node of graph.nodes()) {
      if (node.type !== NODE_TYPE.TRACK && !imageByUri.has(node.uri) && !attempted.has(node.uri)) {
        attempted.add(node.uri);
        pending.push(node.uri);
      }
    }

    let cancelled = false;
    if (pending.length)
      void resolveUriMetadata(pending).then((metas) => {
        if (cancelled) return;
        for (const [uri, meta] of metas)
          if (meta.imageUrl && !imageByUri.has(uri)) show(uri, meta.imageUrl);
        repaint();
      });

    return () => {
      cancelled = true;
    };
  }, [graph, images, settledRevision, imageByUri, attempted, canvas]);
};
