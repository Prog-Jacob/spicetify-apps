import ForceGraph from 'force-graph';
import { EDGE_TYPE } from '../constants';
import type { GraphPalette } from './theme';
import type { MutableRefObject } from 'react';
import { openUriInClient } from '@shared/lib';
import type { MusicGraph } from './music-graph';
import { neighborhoodUris } from './node-query';
import type { GraphNode } from '../types/graph';
import { canExpand } from '../services/expand-node';
import type { RenderNode, RenderLink } from './render-data';
import { applyForces, type PhysicsParams } from './force-config';
import type { PinnedPositions } from '../services/session-store';
import { effectiveRadius, isDragSlop, NODE_REL_SIZE } from './node-style';
import { paintNode, emphasisFor, DIM_ALPHA, type PaintOptions } from './node-paint';

const DOUBLE_CLICK_MS = 350;
const FOCUS_MS = 600;
const FOCUS_ZOOM = 3;
const ZOOM_MS = 250;
const FIT_MS = 500;
const FIRST_FIT_MS = 600;
const FIT_PADDING = 60;
const COOLDOWN_MS = 4000;

/** Everything the canvas reads at event time, refreshed by the view on every commit. */
export type LiveProps = {
  graph: MusicGraph;
  palette: GraphPalette;
  physics: PhysicsParams;
  sizeByDegree: boolean;
  frozen: boolean;
  reducedMotion: boolean;
  expanded: Set<string>;
  expandingUri: string | null;
  marked: Set<string>;
  selectedUri?: string;
  pins: PinnedPositions;
  nodeColor: (node: RenderNode) => string;
  onSelect: (node: GraphNode | null) => void;
  onToggleMark: (node: GraphNode) => void;
  onBackgroundClick: () => void;
  onExpand: (node: GraphNode) => void;
  onPin: (uri: string, x: number, y: number) => void;
};

type LinkEnd = string | number | RenderNode | undefined;

const endNode = (end: LinkEnd): RenderNode | undefined =>
  typeof end === 'object' && end !== null ? end : undefined;

const isIncident = (link: RenderLink, focus: string | null): boolean =>
  focus !== null && (endNode(link.source)?.uri === focus || endNode(link.target)?.uri === focus);

/**
 * Owns force-graph + pointer state (hover/drag) outside React: it mutates at frame rate and only
 * repaints. Props arrive via the `latest` ref so the instance survives callback identity changes.
 */
export class GraphCanvas {
  private readonly fg: ForceGraph<RenderNode, RenderLink>;
  private readonly observer: ResizeObserver;
  private readonly renderNodes: Map<string, RenderNode>;
  private readonly latest: MutableRefObject<LiveProps>;

  private hoverUri: string | null = null;
  private focusUri: string | null = null;
  private focusSet: Set<string> | null = null;
  private lastClick = { uri: '', at: 0 };
  private dragOffset = { x: 0, y: 0 };
  private fitted = false;
  private destroyed = false;

  constructor(
    el: HTMLDivElement,
    latest: MutableRefObject<LiveProps>,
    renderNodes: Map<string, RenderNode>,
    images: Map<string, string>,
  ) {
    this.latest = latest;
    this.renderNodes = renderNodes;

    // Reused and mutated per node so the per-frame paint path allocates nothing.
    const paint: PaintOptions = {
      color: '',
      palette: latest.current.palette,
      images,
      sizeByDegree: false,
      emphasis: 'none',
      expandable: false,
      expanding: false,
      pinned: false,
      marked: false,
      dimAlpha: DIM_ALPHA.hover,
    };

    this.fg = new ForceGraph<RenderNode, RenderLink>(el)
      .backgroundColor(latest.current.palette.background)
      .cooldownTime(COOLDOWN_MS)
      .nodeRelSize(NODE_REL_SIZE)
      .nodeVal((node) => (this.radiusOf(node) / NODE_REL_SIZE) ** 2)
      .linkColor((link) => {
        const { palette } = this.live;
        if (isIncident(link, this.focusUri)) return palette.color.artist;
        return link.type === EDGE_TYPE.COLLABORATED ? palette.color.artist : palette.link;
      })
      .linkWidth((link) => {
        if (isIncident(link, this.focusUri)) return 2;
        return link.type === EDGE_TYPE.COLLABORATED ? 1.5 : 1;
      })
      .onNodeClick((node, event) => {
        if (event.shiftKey) return this.live.onToggleMark(node);
        const now = Date.now();
        const doubled =
          this.lastClick.uri === node.uri && now - this.lastClick.at < DOUBLE_CLICK_MS;
        this.lastClick = { uri: node.uri, at: now };
        if (doubled) this.live.onExpand(node);
        else this.live.onSelect(node);
      })
      .onNodeRightClick((node) => openUriInClient(node.uri))
      .onBackgroundClick(() => this.live.onBackgroundClick())
      .onNodeHover((node) => {
        this.hoverUri = node?.uri ?? null;
        this.setFocus(this.hoverUri ?? this.live.selectedUri ?? null);
      })
      .onNodeDrag((_node, translate) => {
        this.dragOffset = translate;
      })
      .onNodeDragEnd((node) => {
        const { x, y } = this.dragOffset;
        this.dragOffset = { x: 0, y: 0 };
        // A click with a shaky hand must not silently pin: pins persist across sessions.
        if (isDragSlop(x, y, this.fg.zoom())) {
          if (this.live.pins[node.uri]) return;
          node.fx = undefined;
          node.fy = undefined;
          return;
        }
        node.fx = node.x;
        node.fy = node.y;
        this.live.onPin(node.uri, node.x ?? 0, node.y ?? 0);
      })
      .onEngineStop(() => {
        if (this.fitted) return;
        this.fitted = true;
        this.fg.zoomToFit(this.duration(FIRST_FIT_MS), FIT_PADDING);
      })
      .nodeCanvasObject((node, ctx, scale) => {
        const live = this.live;
        paint.color = live.nodeColor(node);
        paint.palette = live.palette;
        paint.sizeByDegree = live.sizeByDegree;
        paint.emphasis = emphasisFor(node.uri, this.focusUri, this.focusSet);
        paint.dimAlpha = this.hoverUri ? DIM_ALPHA.hover : DIM_ALPHA.held;
        paint.expandable = canExpand(node) && !live.expanded.has(node.uri);
        paint.expanding = live.expandingUri === node.uri;
        paint.pinned = live.pins[node.uri] !== undefined;
        paint.marked = live.marked.has(node.uri);
        paintNode(node, ctx, scale, paint);
      });

    this.applyPhysics();

    const resize = () => this.fg.width(el.clientWidth).height(el.clientHeight);
    resize();
    this.observer = new ResizeObserver(resize);
    this.observer.observe(el);
  }

  private get live(): LiveProps {
    return this.latest.current;
  }

  private duration(ms: number): number {
    return this.live.reducedMotion ? 0 : ms;
  }

  private radiusOf = (node: RenderNode): number =>
    effectiveRadius(node.radius, node.degree, this.live.sizeByDegree);

  /** force-graph has no redraw hook; re-setting nodeColor repaints without touching the sim. */
  redraw(): void {
    this.fg.nodeColor(this.fg.nodeColor());
  }

  setFocus(uri: string | null): void {
    this.focusUri = uri;
    this.focusSet = uri ? neighborhoodUris(this.live.graph, uri) : null;
    this.redraw();
  }

  get hovering(): boolean {
    return this.hoverUri !== null;
  }

  /** Drops hover and focus that the current filters have taken off screen. */
  dropHiddenFocus(shown: Set<string>): void {
    if (this.hoverUri && !shown.has(this.hoverUri)) {
      this.hoverUri = null;
      this.setFocus(this.live.selectedUri ?? null);
    } else if (this.focusUri && !shown.has(this.focusUri)) {
      this.setFocus(null);
    }
  }

  setData(nodes: RenderNode[], links: RenderLink[], reheat: boolean): void {
    this.fg.graphData({ nodes, links });
    if (reheat) this.fg.d3ReheatSimulation();
    this.fg.resumeAnimation();
  }

  applyPhysics(reheat = false): void {
    applyForces(this.fg, this.live.physics, this.radiusOf);
    if (reheat) this.fg.d3ReheatSimulation();
    this.fg.resumeAnimation();
  }

  applyBackground(): void {
    this.fg.backgroundColor(this.live.palette.background).resumeAnimation();
    this.redraw();
  }

  resetFit(): void {
    this.fitted = false;
  }

  resume(): void {
    if (this.destroyed) return;
    this.fg.resumeAnimation();
  }

  /** False when the node has no projected position yet, so the caller can retry after a frame. */
  centerOn(uri: string): boolean {
    if (this.destroyed) return false;
    const node = this.renderNodes.get(uri);
    if (node?.x === undefined || node.y === undefined) return false;
    const ms = this.duration(FOCUS_MS);
    this.fg.centerAt(node.x, node.y, ms).zoom(FOCUS_ZOOM, ms);
    return true;
  }

  zoomBy(factor: number): void {
    this.fg.zoom(this.fg.zoom() * factor, this.duration(ZOOM_MS));
  }

  fitView(): void {
    this.fg.zoomToFit(this.duration(FIT_MS), FIT_PADDING);
  }

  capturePng(el: HTMLElement): Promise<Blob | null> {
    return new Promise((resolve, reject) => {
      const canvas = el.querySelector('canvas');
      if (!canvas) return resolve(null);
      try {
        canvas.toBlob(resolve, 'image/png');
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    });
  }

  destroy(): void {
    this.destroyed = true;
    this.observer.disconnect();
    this.fg._destructor();
  }
}
