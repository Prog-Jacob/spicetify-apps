import ForceGraph from 'force-graph';
import { EDGE_TYPE } from '../constants';
import { useGraphPalette } from './theme';
import { openUriInClient } from '@shared/lib';
import type { MusicGraph } from './music-graph';
import { neighborhoodUris } from './node-query';
import { canExpand } from '../services/expand-node';
import type { GraphNode, GraphEdge } from '../types';
import { useNodeArtwork } from '../hooks/use-node-artwork';
import { effectiveRadius, NODE_REL_SIZE } from './node-style';
import { applyForces, type PhysicsParams } from './force-config';
import type { PinnedPositions } from '../services/session-store';
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
  physics: PhysicsParams;
  frozen: boolean;
  marked: Set<string>;
  selectedUri?: string;
  expanded: Set<string>;
  pins: PinnedPositions;
  onSelect: (node: GraphNode | null) => void;
  onToggleMark: (node: GraphNode) => void;
  onBackgroundClick: () => void;
  onExpand: (node: GraphNode) => void;
  onPin: (uri: string, x: number, y: number) => void;
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
      physics,
      frozen,
      marked,
      selectedUri,
      expanded,
      pins,
      onSelect,
      onToggleMark,
      onBackgroundClick,
      onExpand,
      onPin,
    },
    ref,
  ) => {
    const palette = useGraphPalette();
    const paletteRef = useRef(palette);
    paletteRef.current = palette;
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
    const physicsRef = useRef(physics);
    physicsRef.current = physics;
    const graphDataRef = useRef(graph);
    graphDataRef.current = graph;
    const selectedUriRef = useRef(selectedUri);
    selectedUriRef.current = selectedUri;
    const pinsRef = useRef(pins);
    pinsRef.current = pins;
    const onPinRef = useRef(onPin);
    onPinRef.current = onPin;
    const markedRef = useRef(marked);
    markedRef.current = marked;
    const onToggleMarkRef = useRef(onToggleMark);
    onToggleMarkRef.current = onToggleMark;
    const onBackgroundClickRef = useRef(onBackgroundClick);
    onBackgroundClickRef.current = onBackgroundClick;

    const imageByUri = useRef(new Map<string, string>()).current;
    const renderByUri = useRef(new Map<string, RenderNode>()).current;
    const fitted = useRef(false);
    const lastGraphRef = useRef<MusicGraph | null>(null);
    const lastExtraLinksRef = useRef<GraphEdge[] | null>(null);
    const lastRevisionRef = useRef<number>(-1);
    const baseLinksRef = useRef<RenderLink[]>([]);
    const hoverUriRef = useRef<string | null>(null);
    const focusUriRef = useRef<string | null>(null);
    const focusSetRef = useRef<Set<string> | null>(null);

    useNodeArtwork(graph, images, revision, graphRef, imageByUri);

    const requestRedraw = useCallback(() => {
      const fg = graphRef.current;
      fg?.nodeColor(fg.nodeColor());
    }, []);

    const radiusFor = useCallback(
      (node: RenderNode) => effectiveRadius(node.radius, node.degree, sizeByDegreeRef.current),
      [],
    );

    const setFocus = useCallback(
      (uri: string | null) => {
        focusUriRef.current = uri;
        focusSetRef.current = uri ? neighborhoodUris(graphDataRef.current, uri) : null;
        requestRedraw();
      },
      [requestRedraw],
    );

    const applyPins = useCallback(() => {
      for (const node of renderByUri.values()) {
        const pinned = pinsRef.current[node.uri];
        if (pinned) {
          node.fx = pinned.x;
          node.fy = pinned.y;
          node.x ??= pinned.x;
          node.y ??= pinned.y;
        } else if (node.fx != null || node.fy != null) {
          node.fx = undefined;
          node.fy = undefined;
        }
      }
    }, [renderByUri]);

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
        pinned: false,
        marked: false,
      };

      const fg = new ForceGraph<RenderNode, RenderLink>(el)
        .backgroundColor(paletteRef.current.background)
        .cooldownTime(4000)
        .nodeRelSize(NODE_REL_SIZE)
        .nodeVal(
          (node) =>
            (effectiveRadius(node.radius, node.degree, sizeByDegreeRef.current) / NODE_REL_SIZE) **
            2,
        )
        .linkColor((link) => {
          const palette = paletteRef.current;
          if (isIncident(link, focusUriRef.current)) return palette.color.artist;
          return link.type === EDGE_TYPE.COLLABORATED ? palette.color.artist : palette.link;
        })
        .linkWidth((link) => {
          if (isIncident(link, focusUriRef.current)) return 2;
          return link.type === EDGE_TYPE.COLLABORATED ? 1.5 : 1;
        })
        .onNodeClick((node, event) => {
          if (event.shiftKey) {
            onToggleMarkRef.current(node);
            return;
          }
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
        .onBackgroundClick(() => onBackgroundClickRef.current())
        .onNodeHover((node) => {
          hoverUriRef.current = node ? node.uri : null;
          setFocus(hoverUriRef.current ?? selectedUriRef.current ?? null);
        })
        .onNodeDragEnd((node) => {
          node.fx = node.x;
          node.fy = node.y;
          onPinRef.current(node.uri, node.x ?? 0, node.y ?? 0);
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
          paintOpts.pinned = pinsRef.current[node.uri] !== undefined;
          paintOpts.marked = markedRef.current.has(node.uri);
          paintNode(node, ctx, scale, paintOpts);
        });

      applyForces(fg, physicsRef.current, radiusFor);

      const resize = () => fg.width(el.clientWidth).height(el.clientHeight);
      resize();
      const observer = new ResizeObserver(resize);
      observer.observe(el);
      graphRef.current = fg;

      return () => {
        observer.disconnect();
        fg._destructor();
      };
    }, [imageByUri, radiusFor]);

    useEffect(() => {
      graphRef.current?.backgroundColor(palette.background).resumeAnimation();
    }, [palette]);

    useEffect(() => {
      const fg = graphRef.current;
      if (!fg) return;
      const linksChanged =
        lastGraphRef.current !== graph ||
        lastExtraLinksRef.current !== extraLinks ||
        lastRevisionRef.current !== revision;
      if (linksChanged)
        baseLinksRef.current = [...graph.links(), ...extraLinks].map((link) => ({ ...link }));

      const nodes = projectNodes(graph, renderByUri).filter(nodeVisible);
      const shown = new Set(nodes.map((node) => node.uri));
      const links = baseLinksRef.current.filter(
        (link) => shown.has(endUri(link.source) ?? '') && shown.has(endUri(link.target) ?? ''),
      );
      fg.graphData({ nodes, links });
      applyPins();
      const topologyChanged =
        lastGraphRef.current !== graph || lastExtraLinksRef.current !== extraLinks;
      if (lastGraphRef.current !== graph) fitted.current = false;
      lastGraphRef.current = graph;
      lastExtraLinksRef.current = extraLinks;
      lastRevisionRef.current = revision;
      if (topologyChanged) fg.d3ReheatSimulation();
      fg.resumeAnimation();
    }, [graph, revision, extraLinks, nodeVisible, renderByUri, applyPins]);

    useEffect(() => {
      applyPins();
      graphRef.current?.resumeAnimation();
    }, [pins, applyPins]);

    useEffect(() => {
      const fg = graphRef.current;
      if (!fg) return;
      applyForces(fg, physics, radiusFor);
      if (!frozen) fg.d3ReheatSimulation();
      fg.resumeAnimation();
    }, [physics, sizeByDegree, frozen, radiusFor]);

    useEffect(() => {
      const fg = graphRef.current;
      if (!fg) return;
      if (frozen) {
        for (const node of renderByUri.values()) {
          node.fx = node.x;
          node.fy = node.y;
        }
      } else {
        applyPins();
      }
      fg.resumeAnimation();
    }, [frozen, renderByUri, applyPins]);

    useEffect(() => {
      requestRedraw();
    }, [nodeColor, marked, requestRedraw]);

    useEffect(() => {
      if (!hoverUriRef.current) setFocus(selectedUri ?? null);
    }, [selectedUri, setFocus]);

    return <div ref={containerRef} className="h-full w-full overflow-hidden" />;
  },
);

GraphView.displayName = 'GraphView';

export default GraphView;
