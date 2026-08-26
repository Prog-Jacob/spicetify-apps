import ForceGraph from 'force-graph';
import { graphPalette } from './theme';
import { EDGE_TYPE } from '../constants';
import { openUriInClient } from '@shared/lib';
import type { MusicGraph } from './music-graph';
import { configureForces } from './force-config';
import { canExpand } from '../services/expand-node';
import type { GraphNode, GraphEdge } from '../types';
import { useNodeArtwork } from '../hooks/use-node-artwork';
import { NODE_STYLE, degreeScale, NODE_REL_SIZE } from './node-style';
import { paintNode, emphasisFor, type PaintOptions } from './node-paint';
import { projectNodes, type RenderNode, type RenderLink } from './render-data';
import React, { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';

type LinkEnd = string | number | RenderNode | undefined;

const endNode = (end: LinkEnd): RenderNode | undefined =>
  typeof end === 'object' && end !== null ? end : undefined;

const endUri = (end: LinkEnd): string | undefined =>
  typeof end === 'string' ? end : endNode(end)?.uri;

const isIncident = (link: RenderLink, focus: string | null): boolean =>
  focus !== null && (endNode(link.source)?.uri === focus || endNode(link.target)?.uri === focus);

export type GraphViewHandle = {
  focusNode: (uri: string) => void;
  zoomBy: (factor: number) => void;
  fitView: () => void;
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
  selectedUri?: string;
  expanded: Set<string>;
  onSelect: (node: GraphNode | null) => void;
  onExpand: (node: GraphNode) => void;
};

const DOUBLE_CLICK_MS = 350;

const FOCUS_MS = 600;
const FOCUS_ZOOM = 3;

const GraphView = forwardRef<GraphViewHandle, Props>(
  (
    {
      graph,
      images,
      revision,
      nodeVisible,
      nodeColor,
      extraLinks,
      sizeByDegree,
      selectedUri,
      expanded,
      onSelect,
      onExpand,
    },
    ref,
  ) => {
    const palette = graphPalette();
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<ForceGraph<RenderNode, RenderLink>>();
    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;
    const onExpandRef = useRef(onExpand);
    onExpandRef.current = onExpand;
    const expandedRef = useRef(expanded);
    expandedRef.current = expanded;
    const lastClickRef = useRef({ uri: '', at: 0 });
    const sizeByDegreeRef = useRef(sizeByDegree);
    sizeByDegreeRef.current = sizeByDegree;
    const nodeColorRef = useRef(nodeColor);
    nodeColorRef.current = nodeColor;
    const graphDataRef = useRef(graph);
    graphDataRef.current = graph;
    const selectedUriRef = useRef(selectedUri);
    selectedUriRef.current = selectedUri;

    const imageByUri = useRef(new Map<string, string>()).current;
    const renderByUri = useRef(new Map<string, RenderNode>()).current;
    const fitted = useRef(false);
    const lastGraphRef = useRef<MusicGraph | null>(null);
    const lastExtraLinksRef = useRef<GraphEdge[] | null>(null);
    const hoverUriRef = useRef<string | null>(null);
    const focusUriRef = useRef<string | null>(null);
    const focusSetRef = useRef<Set<string> | null>(null);

    useNodeArtwork(graph, images, revision, graphRef, imageByUri);

    // Neighbour set is recomputed here on focus change, never per frame.
    const setFocus = useCallback((uri: string | null) => {
      focusUriRef.current = uri;
      focusSetRef.current = uri
        ? new Set([uri, ...graphDataRef.current.neighbors(uri).map((n) => n.uri)])
        : null;
      graphRef.current?.resumeAnimation();
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        focusNode: (uri: string) => {
          const node = renderByUri.get(uri);
          const fg = graphRef.current;
          if (node && fg)
            fg.centerAt(node.x ?? 0, node.y ?? 0, FOCUS_MS).zoom(FOCUS_ZOOM, FOCUS_MS);
        },
        zoomBy: (factor: number) => {
          const fg = graphRef.current;
          if (fg) fg.zoom(fg.zoom() * factor, 250);
        },
        fitView: () => graphRef.current?.zoomToFit(500, 60),
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

      const paintOpts: PaintOptions = {
        color: '',
        images: imageByUri,
        sizeByDegree: false,
        emphasis: 'none',
        expandable: false,
      };

      const fg = new ForceGraph<RenderNode, RenderLink>(el)
        .backgroundColor(palette.background)
        .cooldownTime(4000)
        .nodeRelSize(NODE_REL_SIZE)
        .nodeVal(
          (node) =>
            NODE_STYLE[node.type].area *
            (sizeByDegreeRef.current ? degreeScale(node.degree) ** 2 : 1),
        )
        .linkColor((link) => {
          if (isIncident(link, focusUriRef.current)) return palette.color.artist;
          return link.type === EDGE_TYPE.COLLABORATED ? palette.color.artist : palette.link;
        })
        .linkWidth((link) => {
          if (isIncident(link, focusUriRef.current)) return 2;
          return link.type === EDGE_TYPE.COLLABORATED ? 1.5 : 1;
        })
        .onNodeClick((node) => {
          const now = Date.now();
          const last = lastClickRef.current;
          if (last.uri === node.uri && now - last.at < DOUBLE_CLICK_MS) {
            onExpandRef.current(node);
          } else {
            onSelectRef.current(node);
          }
          lastClickRef.current = { uri: node.uri, at: now };
        })
        .onNodeRightClick((node) => openUriInClient(node.uri))
        .onBackgroundClick(() => onSelectRef.current(null))
        .onNodeHover((node) => {
          hoverUriRef.current = node ? node.uri : null;
          setFocus(hoverUriRef.current ?? selectedUriRef.current ?? null);
        })
        .onNodeDragEnd((node) => {
          node.fx = node.x;
          node.fy = node.y;
        })
        .onEngineStop(() => {
          if (fitted.current) return;
          fitted.current = true;
          fg.zoomToFit(600, 60);
        })
        // Reused and mutated per node so the per-frame paint path allocates nothing.
        .nodeCanvasObject((node, ctx, scale) => {
          paintOpts.color = nodeColorRef.current(node);
          paintOpts.sizeByDegree = sizeByDegreeRef.current;
          paintOpts.emphasis = emphasisFor(node.uri, focusUriRef.current, focusSetRef.current);
          paintOpts.expandable = canExpand(node.type) && !expandedRef.current.has(node.uri);
          paintNode(node, ctx, scale, paintOpts);
        });

      configureForces(fg);

      const resize = () => fg.width(el.clientWidth).height(el.clientHeight);
      resize();
      const observer = new ResizeObserver(resize);
      observer.observe(el);
      graphRef.current = fg;

      return () => {
        observer.disconnect();
        fg._destructor();
      };
    }, [palette, imageByUri]);

    useEffect(() => {
      const fg = graphRef.current;
      if (!fg) return;
      const nodes = projectNodes(graph, renderByUri).filter(nodeVisible);
      const shown = new Set(nodes.map((node) => node.uri));
      const links = [...graph.links(), ...extraLinks].filter(
        (link) => shown.has(endUri(link.source) ?? '') && shown.has(endUri(link.target) ?? ''),
      );
      fg.graphData({ nodes, links });
      const topologyChanged =
        lastGraphRef.current !== graph || lastExtraLinksRef.current !== extraLinks;
      if (lastGraphRef.current !== graph) fitted.current = false;
      lastGraphRef.current = graph;
      lastExtraLinksRef.current = extraLinks;
      if (topologyChanged) fg.d3ReheatSimulation();
      fg.resumeAnimation();
    }, [graph, revision, extraLinks, nodeVisible, renderByUri]);

    // Size changes the layout spacing, so reheat; colour doesn't, so just repaint.
    useEffect(() => {
      graphRef.current?.d3ReheatSimulation().resumeAnimation();
    }, [sizeByDegree]);

    useEffect(() => {
      graphRef.current?.resumeAnimation();
    }, [nodeColor]);

    useEffect(() => {
      if (!hoverUriRef.current) setFocus(selectedUri ?? null);
    }, [selectedUri, setFocus]);

    return <div ref={containerRef} className="h-full w-full overflow-hidden" />;
  },
);

GraphView.displayName = 'GraphView';

export default GraphView;
