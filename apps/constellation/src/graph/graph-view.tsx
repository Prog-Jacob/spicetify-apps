import { useGraphPalette } from './theme';
import type { MusicGraph } from './music-graph';
import { useNodeArtwork } from './use-node-artwork';
import type { GraphEdge } from '../types/graph';
import { GraphCanvas, type LiveProps } from './graph-canvas';
import type { PinnedPositions } from '../services/session-store';
import { projectNodes, type RenderNode, type RenderLink } from './render-data';
import React, {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useCallback,
  useLayoutEffect,
  useImperativeHandle,
} from 'react';

type LinkEnd = string | number | RenderNode | undefined;

const endUri = (end: LinkEnd): string | undefined =>
  typeof end === 'string' ? end : typeof end === 'object' && end !== null ? end.uri : undefined;

export type GraphViewHandle = {
  focusNode: (uri: string) => void;
  zoomBy: (factor: number) => void;
  fitView: () => void;
  capturePng: () => Promise<Blob | null>;
};

type Props = Omit<LiveProps, 'palette'> & {
  images: Map<string, string>;
  revision: number;
  extraLinks: GraphEdge[];
  visibleUris: Set<string>;
  pins: PinnedPositions;
  'aria-label': string;
};

const GraphView = forwardRef<GraphViewHandle, Props>((props, ref) => {
  const { graph, images, revision, visibleUris, extraLinks, physics, sizeByDegree, frozen } = props;
  const { pins, nodeColor, marked, selectedUri } = props;
  const palette = useGraphPalette();

  /**
   * The canvas outlives every render, so it reads props through this ref rather than capturing
   * them. The write is a layout effect, not render-phase: a render React discards must not publish.
   */
  const latest = useRef<LiveProps>({ ...props, palette });
  useLayoutEffect(() => {
    latest.current = { ...props, palette };
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const renderNodes = useRef(new Map<string, RenderNode>()).current;
  const imageByUri = useRef(new Map<string, string>()).current;
  const [canvas, setCanvas] = useState<GraphCanvas | null>(null);

  const lastGraphRef = useRef<MusicGraph | null>(null);
  const lastExtraLinksRef = useRef<GraphEdge[] | null>(null);
  const lastRevisionRef = useRef(-1);
  const baseLinksRef = useRef<RenderLink[]>([]);
  const pendingFocusRef = useRef<string | null>(null);

  useNodeArtwork(graph, images, revision, canvas, imageByUri);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const instance = new GraphCanvas(el, latest, renderNodes, imageByUri);
    setCanvas(instance);
    return () => {
      instance.destroy();
      setCanvas(null);
    };
  }, [renderNodes, imageByUri]);

  useImperativeHandle(
    ref,
    () => ({
      focusNode: (uri) => {
        // A node added this tick has no projected position yet; flush on the next projection.
        if (!canvas?.centerOn(uri)) pendingFocusRef.current = uri;
      },
      zoomBy: (factor) => canvas?.zoomBy(factor),
      fitView: () => canvas?.fitView(),
      capturePng: async () =>
        containerRef.current && canvas ? canvas.capturePng(containerRef.current) : null,
    }),
    [canvas],
  );

  const applyFixedPositions = useCallback(() => {
    const { pins, frozen } = latest.current;
    for (const node of renderNodes.values()) {
      const pinned = pins[node.uri];
      if (pinned) {
        node.fx = pinned.x;
        node.fy = pinned.y;
        node.x ??= pinned.x;
        node.y ??= pinned.y;
      } else if (frozen) {
        node.fx = node.x;
        node.fy = node.y;
      } else if (node.fx != null || node.fy != null) {
        node.fx = undefined;
        node.fy = undefined;
      }
    }
  }, [renderNodes]);

  useEffect(() => {
    if (!canvas) return;
    const graphChanged = lastGraphRef.current !== graph;
    const extraChanged = lastExtraLinksRef.current !== extraLinks;
    if (graphChanged || extraChanged || lastRevisionRef.current !== revision)
      baseLinksRef.current = [...graph.links(), ...extraLinks].map((link) => ({ ...link }));

    const nodes = projectNodes(graph, renderNodes).filter((node) => visibleUris.has(node.uri));
    canvas.dropHiddenFocus(visibleUris);

    const links = baseLinksRef.current.filter(
      (link) =>
        visibleUris.has(endUri(link.source) ?? '') && visibleUris.has(endUri(link.target) ?? ''),
    );
    if (graphChanged) canvas.resetFit();
    canvas.setData(nodes, links, graphChanged || extraChanged);
    applyFixedPositions();
    lastGraphRef.current = graph;
    lastExtraLinksRef.current = extraLinks;
    lastRevisionRef.current = revision;

    const pending = pendingFocusRef.current;
    if (pending && visibleUris.has(pending)) {
      pendingFocusRef.current = null;
      requestAnimationFrame(() => canvas.centerOn(pending));
    }
  }, [canvas, graph, revision, extraLinks, visibleUris, renderNodes, applyFixedPositions]);

  useEffect(() => canvas?.applyBackground(), [canvas, palette]);

  useEffect(() => {
    applyFixedPositions();
    canvas?.resume();
  }, [canvas, pins, frozen, applyFixedPositions]);

  useEffect(() => {
    // sizeByDegree is read through `latest`, so it must invalidate here to reach the force config.
    canvas?.applyPhysics(!frozen);
  }, [canvas, physics, sizeByDegree, frozen]);

  useEffect(() => canvas?.redraw(), [canvas, nodeColor, marked]);

  useEffect(() => {
    if (!canvas?.hovering) canvas?.setFocus(selectedUri ?? null);
  }, [canvas, selectedUri]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={props['aria-label']}
      className="h-full w-full overflow-hidden"
    />
  );
});

GraphView.displayName = 'GraphView';

export default GraphView;
