import ForceGraph from 'force-graph';
import { toRenderData } from './render-data';
import type { MusicGraph } from './music-graph';
import type { RenderNode } from './render-data';
import { resolveUriMetadata } from '@shared/api';
import React, { useEffect, useRef } from 'react';
import { readGraphPalette, type GraphPalette } from './theme';
import {
  monogram,
  NODE_AREA,
  NODE_RADIUS,
  NODE_REL_SIZE,
  hueFromString,
  AVATAR_MIN_SCREEN_RADIUS,
} from './node-style';

type Props = {
  graph: MusicGraph;
  images: Map<string, string>;
  onSelect: (node: RenderNode | null) => void;
};

const TWO_PI = Math.PI * 2;

// Session cache of loaded avatar images, keyed by URL. crossOrigin keeps the canvas
// untainted so a future PNG export stays possible.
const imageCache = new Map<string, HTMLImageElement>();

const loadImage = (url: string, onReady: () => void): void => {
  if (imageCache.has(url)) return;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = onReady;
  img.src = url;
  imageCache.set(url, img);
};

const readyImage = (url?: string): HTMLImageElement | undefined => {
  const img = url ? imageCache.get(url) : undefined;
  return img?.complete && img.naturalWidth > 0 ? img : undefined;
};

const paintAvatar = (node: RenderNode, ctx: CanvasRenderingContext2D, r: number, url?: string) => {
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const img = readyImage(url);

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TWO_PI);
  ctx.clip();
  if (img) {
    ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
  } else {
    const hue = hueFromString(node.uri);
    const gradient = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    gradient.addColorStop(0, `hsl(${hue}, 52%, 58%)`);
    gradient.addColorStop(1, `hsl(${(hue + 38) % 360}, 58%, 30%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.font = `600 ${r}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(monogram(node.label), x, y + 0.5);
  }
  ctx.restore();
};

const paintNode = (
  node: RenderNode,
  ctx: CanvasRenderingContext2D,
  scale: number,
  palette: GraphPalette,
  images: Map<string, string>,
) => {
  const r = NODE_RADIUS[node.type];
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const color = palette.color[node.type];

  // Tracks stay dots; every node collapses to a dot when too small to read art.
  if (node.type === 'track' || r * scale < AVATAR_MIN_SCREEN_RADIUS) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TWO_PI);
    ctx.fill();
    return;
  }

  paintAvatar(node, ctx, r, images.get(node.uri));
  ctx.lineWidth = 2 / scale;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TWO_PI);
  ctx.stroke();
};

const GraphView = ({ graph, images, onSelect }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraph<RenderNode>>();
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  // URL per node, resolved lazily; the paint path reads it, so the domain stays image-free.
  const imageByUri = useRef(new Map<string, string>()).current;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const palette = readGraphPalette();
    const fg = new ForceGraph<RenderNode>(el)
      .backgroundColor(palette.background)
      .nodeRelSize(NODE_REL_SIZE)
      .nodeVal((node) => NODE_AREA[node.type])
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
  }, [imageByUri]);

  useEffect(() => {
    const fg = graphRef.current;
    if (!fg) return;
    fg.graphData(toRenderData(graph));

    // The graph auto-pauses rendering when the layout settles, so nudge one repaint each
    // time artwork lands late.
    const repaint = () => graphRef.current?.resumeAnimation();
    const show = (uri: string, url: string) => {
      imageByUri.set(uri, url);
      loadImage(url, repaint);
    };

    for (const [uri, url] of images) show(uri, url);

    // Non-track nodes get their real cover from oEmbed. Resolves the whole set at once:
    // fine for library sizes, gate behind viewport/LOD if huge graphs stutter.
    let cancelled = false;
    const pending = graph
      .nodes()
      .filter((n) => n.type !== 'track' && !imageByUri.has(n.uri))
      .map((n) => n.uri);
    void resolveUriMetadata(pending).then((metas) => {
      if (cancelled) return;
      for (const [uri, meta] of metas) if (meta.imageUrl) show(uri, meta.imageUrl);
      repaint();
    });

    return () => {
      cancelled = true;
    };
  }, [graph, images, imageByUri]);

  return <div ref={containerRef} className="h-full w-full" />;
};

export default GraphView;
