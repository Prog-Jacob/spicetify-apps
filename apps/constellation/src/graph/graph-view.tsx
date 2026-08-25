import { graphPalette } from './theme';
import { EDGE_TYPE } from '../constants';
import type { MusicGraph } from './music-graph';
import type { RenderNode } from './render-data';
import { resolveUriMetadata } from '@shared/api';
import { loadImage, paintNode } from './node-paint';
import ForceGraph, { type LinkObject } from 'force-graph';
import type { GraphNode, GraphEdge, EdgeType } from '../types';
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  monogram,
  nodeRadius,
  NODE_STYLE,
  degreeScale,
  NODE_REL_SIZE,
  hueFromString,
} from './node-style';

type RenderLink = LinkObject<RenderNode> & { type: EdgeType };

export type GraphViewHandle = {
  focusNode: (uri: string) => void;
  capturePng: () => Promise<Blob | null>;
};

type Props = {
  graph: MusicGraph;
  images: Map<string, string>;
  revision: number;
  nodeVisible: (node: GraphNode) => boolean;
  nodeColor: (node: RenderNode) => string;
  extraLinks: GraphEdge[];
  sizeByDegree: boolean;
  onSelect: (node: GraphNode | null) => void;
};

const FOCUS_MS = 600;
const FOCUS_ZOOM = 3;

const GraphView = forwardRef<GraphViewHandle, Props>(
  (
    { graph, images, revision, nodeVisible, nodeColor, extraLinks, sizeByDegree, onSelect },
    ref,
  ) => {
    const palette = graphPalette();
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<ForceGraph<RenderNode, RenderLink>>();
    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;
    const sizeByDegreeRef = useRef(sizeByDegree);
    sizeByDegreeRef.current = sizeByDegree;
    const nodeColorRef = useRef(nodeColor);
    nodeColorRef.current = nodeColor;

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

      const fg = new ForceGraph<RenderNode, RenderLink>(el)
        .backgroundColor(palette.background)
        .nodeRelSize(NODE_REL_SIZE)
        .nodeVal(
          (node) =>
            NODE_STYLE[node.type].area *
            (sizeByDegreeRef.current ? degreeScale(node.degree) ** 2 : 1),
        )
        .linkColor((link) =>
          link.type === EDGE_TYPE.COLLABORATED ? palette.color.artist : palette.link,
        )
        .onNodeClick((node) => onSelectRef.current(node))
        .onBackgroundClick(() => onSelectRef.current(null))
        .nodeCanvasObject((node, ctx, scale) =>
          paintNode(
            node,
            ctx,
            scale,
            nodeColorRef.current(node),
            imageByUri,
            sizeByDegreeRef.current,
          ),
        );

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
        const degree = graph.degree(node.uri);
        const existing = renderByUri.get(node.uri);
        if (existing) {
          existing.degree = degree;
          return existing;
        }
        const created: RenderNode = {
          ...node,
          id: node.uri,
          radius: nodeRadius(node.type),
          hue: hueFromString(node.uri),
          monogram: monogram(node.label),
          degree,
        };
        renderByUri.set(node.uri, created);
        return created;
      });
      fg.graphData({ nodes, links: [...graph.links(), ...extraLinks] });

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
    }, [graph, images, revision, extraLinks, imageByUri, attempted, renderByUri]);

    useEffect(() => {
      const fg = graphRef.current;
      if (!fg) return;
      const endVisible = (end: string | number | RenderNode | undefined) =>
        typeof end === 'object' && end !== null ? nodeVisible(end) : false;
      fg.nodeVisibility(nodeVisible).linkVisibility(
        (link) => endVisible(link.source) && endVisible(link.target),
      );
    }, [nodeVisible]);

    // Node sizes changed: re-space the layout for the new radii and repaint.
    useEffect(() => {
      graphRef.current?.d3ReheatSimulation().resumeAnimation();
    }, [sizeByDegree]);

    // Node colouring changed (lens or theme): repaint without disturbing the layout.
    useEffect(() => {
      graphRef.current?.resumeAnimation();
    }, [nodeColor]);

    return <div ref={containerRef} className="h-full w-full" />;
  },
);

GraphView.displayName = 'GraphView';

export default GraphView;
