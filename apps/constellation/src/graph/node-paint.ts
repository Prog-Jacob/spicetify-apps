import type { GraphPalette } from './theme';
import type { RenderNode } from './render-data';
import { effectiveRadius, AVATAR_MIN_SCREEN_RADIUS, LABEL_MIN_SCREEN_RADIUS } from './node-style';

const TWO_PI = Math.PI * 2;
const LABEL_SCREEN_PX = 11;

const IMAGE_CACHE_MAX = 2048;
const imageCache = new Map<string, HTMLImageElement>();

export const loadImage = (url: string, onReady: () => void): void => {
  if (imageCache.has(url)) return;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = onReady;
  img.src = url;
  imageCache.set(url, img);
  if (imageCache.size > IMAGE_CACHE_MAX) {
    const oldest = imageCache.keys().next().value;
    if (oldest !== undefined) imageCache.delete(oldest);
  }
};

const readyImage = (url?: string): HTMLImageElement | undefined => {
  const img = url ? imageCache.get(url) : undefined;
  return img?.complete && img.naturalWidth > 0 ? img : undefined;
};

let sheenGradient: CanvasGradient | null = null;
const unitSheen = (ctx: CanvasRenderingContext2D): CanvasGradient => {
  if (sheenGradient) return sheenGradient;
  sheenGradient = ctx.createLinearGradient(0, -1, 0, 1);
  sheenGradient.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
  sheenGradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  return sheenGradient;
};

const paintAvatar = (
  node: RenderNode,
  ctx: CanvasRenderingContext2D,
  r: number,
  color: string,
  monogramColor: string,
  img?: HTMLImageElement,
) => {
  const x = node.x ?? 0;
  const y = node.y ?? 0;

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TWO_PI);
  ctx.clip();
  if (img) {
    ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = color;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(r, r);
    ctx.fillStyle = unitSheen(ctx);
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
    ctx.fillStyle = monogramColor;
    ctx.font = `600 ${r}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.monogram, x, y + 0.5);
  }
  ctx.restore();
};

let labelFont = '';
let labelFontScale = NaN;

const paintLabel = (
  node: RenderNode,
  ctx: CanvasRenderingContext2D,
  scale: number,
  r: number,
  palette: GraphPalette,
) => {
  if (scale !== labelFontScale) {
    labelFontScale = scale;
    labelFont = `600 ${LABEL_SCREEN_PX / scale}px sans-serif`;
  }
  const x = node.x ?? 0;
  const y = (node.y ?? 0) + r + 3 / scale;
  ctx.font = labelFont;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.lineWidth = 3 / scale;
  ctx.strokeStyle = palette.surface;
  ctx.strokeText(node.shortLabel, x, y);
  ctx.fillStyle = palette.text;
  ctx.fillText(node.shortLabel, x, y);
};

type NodeEmphasis = 'active' | 'dim' | 'none';

export const emphasisFor = (
  uri: string,
  focusUri: string | null,
  focusSet: Set<string> | null,
): NodeEmphasis =>
  !focusUri ? 'none' : uri === focusUri ? 'active' : focusSet?.has(uri) ? 'none' : 'dim';

export type PaintOptions = {
  color: string;
  palette: GraphPalette;
  images: Map<string, string>;
  sizeByDegree: boolean;
  emphasis: NodeEmphasis;
  expandable: boolean;
  expanding: boolean;
  pinned: boolean;
  marked: boolean;
  dimAlpha: number;
};

/**
 * Hovering sweeps focus across the graph, so a hard dim strobes everything the pointer grazes.
 * A deliberate selection is a held state and can afford to be much stronger than a transient hover.
 */
export const DIM_ALPHA = { hover: 0.4, held: 0.16 };

const paintPinBadge = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  palette: GraphPalette,
) => {
  const bx = x - r * 0.72;
  const by = y - r * 0.72;
  const br = r * 0.28;
  ctx.fillStyle = palette.surface;
  ctx.beginPath();
  ctx.arc(bx, by, br + r * 0.05, 0, TWO_PI);
  ctx.fill();
  ctx.fillStyle = palette.text;
  ctx.beginPath();
  ctx.arc(bx, by, br, 0, TWO_PI);
  ctx.fill();
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.arc(bx, by, br * 0.5, 0, TWO_PI);
  ctx.fill();
};

const paintExpandBadge = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  palette: GraphPalette,
  expanding: boolean,
) => {
  const bx = x + r * 0.72;
  const by = y - r * 0.72;
  const br = r * 0.3;
  ctx.fillStyle = palette.surface;
  ctx.beginPath();
  ctx.arc(bx, by, br + r * 0.05, 0, TWO_PI);
  ctx.fill();
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.arc(bx, by, br, 0, TWO_PI);
  ctx.fill();
  ctx.strokeStyle = palette.text;
  ctx.lineWidth = br * 0.28;
  const s = br * 0.5;
  ctx.beginPath();
  if (expanding) {
    ctx.moveTo(bx - s, by);
    ctx.lineTo(bx + s, by);
  } else {
    ctx.moveTo(bx - s, by);
    ctx.lineTo(bx + s, by);
    ctx.moveTo(bx, by - s);
    ctx.lineTo(bx, by + s);
  }
  ctx.stroke();
};

export const paintNode = (
  node: RenderNode,
  ctx: CanvasRenderingContext2D,
  scale: number,
  opts: PaintOptions,
) => {
  const { color, palette, images, sizeByDegree, emphasis, expandable, pinned, marked } = opts;
  const r = effectiveRadius(node.radius, node.degree, sizeByDegree);
  const screenR = r * scale;
  const x = node.x ?? 0;
  const y = node.y ?? 0;

  ctx.save();
  if (emphasis === 'dim' && !marked) ctx.globalAlpha = opts.dimAlpha;
  if (emphasis === 'active') {
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
  }

  const bigEnough = screenR >= AVATAR_MIN_SCREEN_RADIUS;
  const img = bigEnough ? readyImage(images.get(node.uri)) : undefined;
  const showAvatar = bigEnough && (node.type !== 'track' || img !== undefined);
  if (!showAvatar) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TWO_PI);
    ctx.fill();
  } else {
    paintAvatar(node, ctx, r, color, palette.text, img);
    ctx.lineWidth = 2 / scale;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TWO_PI);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  if (emphasis === 'active') {
    ctx.lineWidth = 2.5 / scale;
    ctx.strokeStyle = palette.ring;
    ctx.beginPath();
    ctx.arc(x, y, r + 3 / scale, 0, TWO_PI);
    ctx.stroke();
  }

  if (marked) {
    ctx.globalAlpha = 1;
    ctx.lineWidth = 2.5 / scale;
    ctx.strokeStyle = palette.mark;
    ctx.beginPath();
    ctx.arc(x, y, r + 4 / scale, 0, TWO_PI);
    ctx.stroke();
  }

  if (
    (emphasis === 'active' || opts.expanding) &&
    expandable &&
    screenR >= AVATAR_MIN_SCREEN_RADIUS
  )
    paintExpandBadge(ctx, x, y, r, palette, opts.expanding);

  if (pinned && screenR >= AVATAR_MIN_SCREEN_RADIUS) paintPinBadge(ctx, x, y, r, palette);

  if (screenR >= LABEL_MIN_SCREEN_RADIUS || emphasis === 'active' || marked)
    paintLabel(node, ctx, scale, r, palette);
  ctx.restore();
};
