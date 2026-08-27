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
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = `600 ${r}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.monogram, x, y + 0.5);
  }
  ctx.restore();
};

let labelFont = '';
let labelFontScale = NaN;

const paintLabel = (node: RenderNode, ctx: CanvasRenderingContext2D, scale: number, r: number) => {
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
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.strokeText(node.label, x, y);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillText(node.label, x, y);
};

export type NodeEmphasis = 'active' | 'dim' | 'none';

export const emphasisFor = (
  uri: string,
  focusUri: string | null,
  focusSet: Set<string> | null,
): NodeEmphasis =>
  !focusUri ? 'none' : uri === focusUri ? 'active' : focusSet?.has(uri) ? 'none' : 'dim';

export type PaintOptions = {
  color: string;
  images: Map<string, string>;
  sizeByDegree: boolean;
  emphasis: NodeEmphasis;
  expandable: boolean;
  pinned: boolean;
  marked: boolean;
};

const MARK_RING = 'rgba(96, 208, 255, 0.95)';

const paintPinBadge = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  const bx = x - r * 0.72;
  const by = y - r * 0.72;
  const br = r * 0.28;
  // Mirror of the expand badge to the top-left, so a pinned expandable node shows both.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.arc(bx, by, br + r * 0.05, 0, TWO_PI);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.beginPath();
  ctx.arc(bx, by, br, 0, TWO_PI);
  ctx.fill();
  ctx.fillStyle = 'rgba(30, 215, 96, 0.95)';
  ctx.beginPath();
  ctx.arc(bx, by, br * 0.5, 0, TWO_PI);
  ctx.fill();
};

const paintExpandBadge = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  const bx = x + r * 0.72;
  const by = y - r * 0.72;
  const br = r * 0.3;
  // Dark seat first so the badge reads cleanly over the node rim.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.arc(bx, by, br + r * 0.05, 0, TWO_PI);
  ctx.fill();
  ctx.fillStyle = 'rgba(30, 215, 96, 0.95)';
  ctx.beginPath();
  ctx.arc(bx, by, br, 0, TWO_PI);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.lineWidth = br * 0.28;
  const s = br * 0.5;
  ctx.beginPath();
  ctx.moveTo(bx - s, by);
  ctx.lineTo(bx + s, by);
  ctx.moveTo(bx, by - s);
  ctx.lineTo(bx, by + s);
  ctx.stroke();
};

export const paintNode = (
  node: RenderNode,
  ctx: CanvasRenderingContext2D,
  scale: number,
  { color, images, sizeByDegree, emphasis, expandable, pinned, marked }: PaintOptions,
) => {
  const r = effectiveRadius(node.radius, node.degree, sizeByDegree);
  const screenR = r * scale;
  const x = node.x ?? 0;
  const y = node.y ?? 0;

  ctx.save();
  if (emphasis === 'dim' && !marked) ctx.globalAlpha = 0.16;
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
    paintAvatar(node, ctx, r, color, img);
    ctx.lineWidth = 2 / scale;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TWO_PI);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  if (emphasis === 'active') {
    ctx.lineWidth = 2.5 / scale;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(x, y, r + 3 / scale, 0, TWO_PI);
    ctx.stroke();
  }

  if (marked) {
    ctx.globalAlpha = 1;
    ctx.lineWidth = 2.5 / scale;
    ctx.strokeStyle = MARK_RING;
    ctx.beginPath();
    ctx.arc(x, y, r + 4 / scale, 0, TWO_PI);
    ctx.stroke();
  }

  if (expandable && emphasis === 'active' && screenR >= AVATAR_MIN_SCREEN_RADIUS) {
    paintExpandBadge(ctx, x, y, r);
  }

  if (pinned && screenR >= AVATAR_MIN_SCREEN_RADIUS) paintPinBadge(ctx, x, y, r);

  if (screenR >= LABEL_MIN_SCREEN_RADIUS || emphasis === 'active' || marked)
    paintLabel(node, ctx, scale, r);
  ctx.restore();
};
