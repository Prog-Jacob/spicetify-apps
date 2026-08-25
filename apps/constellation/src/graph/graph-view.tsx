import ForceGraph from 'force-graph';
import { graphPalette } from './theme';
import type { GraphNode } from '../types';
import type { MusicGraph } from './music-graph';
import type { RenderNode } from './render-data';
import { resolveUriMetadata } from '@shared/api';
import { loadImage, paintNode } from './node-paint';
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { nodeRadius, NODE_STYLE, NODE_REL_SIZE, hueFromString } from './node-style';

export type GraphViewHandle = {
  focusNode: (uri: string) => void;
  capturePng: () => Promise<Blob | null>;
};

type Props = {
  graph: MusicGraph;
  images: Map<string, string>;
  revision: number;
  nodeVisible: (node: GraphNode) => boolean;
  onSelect: (node: GraphNode | null) => void;
};

const FOCUS_MS = 600;
const FOCUS_ZOOM = 3;

const GraphView = forwardRef<GraphViewHandle, Props>(
  ({ graph, images, revision, nodeVisible, onSelect }, ref) => {
    const palette = graphPalette();
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<ForceGraph<RenderNode>>();
    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;

    const imageByUri = useRef(new Map<string, string>()).current;
    const attempted = useRef(new Set<string>()).current;
    const renderByUri = useRef(new Map<string, RenderNode>()).current;

    useImperativeHandle(
      ref,
      () => ({
        focusNode: (uri: string) => {
          const node = renderByUri.get(uri);
          const fg = graphRef.current;
          if (node && fg)
            fg.centerAt(node.x ?? 0, node.y ?? 0, FOCUS_MS).zoom(FOCUS_ZOOM, FOCUS_MS);
        },
        capturePng: () =>
          new Promise<Blob | null>((resolve) => {
            const canvas = containerRef.current?.querySelector('canvas');
            if (!canvas) return resolve(null);
            canvas.toBlob(resolve, 'image/png');
          }),
      }),
      [renderByUri],
    );

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      const fg = new ForceGraph<RenderNode>(el)
        .backgroundColor(palette.background)
        .nodeRelSize(NODE_REL_SIZE)
        .nodeVal((node) => NODE_STYLE[node.type].area)
        .linkColor(() => palette.link)
        .onNodeClick((node) => onSelectRef.current(node))
        .onBackgroundClick(() => onSelectRef.current(null))
        .nodeCanvasObject((node, ctx, scale) => paintNode(node, ctx, scale, palette, imageByUri));

      const resize = () => fg.width(el.clientWidth).height(el.clientHeight);
      resize();
      window.addEventListener('resize', resize);
      graphRef.current = fg;

      return () => {
        window.removeEventListener('resize', resize);
        fg._destructor();
      };
    }, [palette, imageByUri]);

    useEffect(() => {
      const fg = graphRef.current;
      if (!fg) return;

      const pending: string[] = [];
      const nodes = graph.nodes().map((node) => {
        if (node.type !== 'track' && !imageByUri.has(node.uri) && !attempted.has(node.uri)) {
          attempted.add(node.uri);
          pending.push(node.uri);
        }
        const existing = renderByUri.get(node.uri);
        if (existing) return existing;
        const created: RenderNode = {
          ...node,
          id: node.uri,
          radius: nodeRadius(node.type),
          hue: hueFromString(node.uri),
        };
        renderByUri.set(node.uri, created);
        return created;
      });
      fg.graphData({ nodes, links: graph.links() });

      // The graph auto-pauses rendering when the layout settles, so nudge one repaint each
      // time artwork lands late.
      const repaint = () => graphRef.current?.resumeAnimation();
      const show = (uri: string, url: string) => {
        if (imageByUri.has(uri)) return;
        imageByUri.set(uri, url);
        loadImage(url, repaint);
      };

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
    }, [graph, images, revision, imageByUri, attempted, renderByUri]);

    useEffect(() => {
      const fg = graphRef.current;
      if (!fg) return;
      const endVisible = (end: string | number | RenderNode | undefined) =>
        typeof end === 'object' && end !== null ? nodeVisible(end) : false;
      fg.nodeVisibility(nodeVisible).linkVisibility(
        (link) => endVisible(link.source) && endVisible(link.target),
      );
    }, [nodeVisible]);

    return <div ref={containerRef} className="h-full w-full" />;
  },
);

GraphView.displayName = 'GraphView';

export default GraphView;
