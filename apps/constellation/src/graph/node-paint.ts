import type { RenderNode } from './render-data';
import { degreeScale, AVATAR_MIN_SCREEN_RADIUS, LABEL_MIN_SCREEN_RADIUS } from './node-style';

const TWO_PI = Math.PI * 2;
const LABEL_SCREEN_PX = 11;

const IMAGE_CACHE_MAX = 512;
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
    const gradient = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    gradient.addColorStop(0, `hsl(${node.hue}, 52%, 58%)`);
    gradient.addColorStop(1, `hsl(${(node.hue + 38) % 360}, 58%, 30%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
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
  color: string,
) => {
  if (scale !== labelFontScale) {
    labelFontScale = scale;
    labelFont = `500 ${LABEL_SCREEN_PX / scale}px sans-serif`;
  }
  ctx.font = labelFont;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(node.label, node.x ?? 0, (node.y ?? 0) + r + 3 / scale);
};

export const paintNode = (
  node: RenderNode,
  ctx: CanvasRenderingContext2D,
  scale: number,
  color: string,
  images: Map<string, string>,
  sizeByDegree: boolean,
) => {
  const r = sizeByDegree ? node.radius * degreeScale(node.degree) : node.radius;
  const screenR = r * scale;
  const x = node.x ?? 0;
  const y = node.y ?? 0;

  // Tracks stay dots; every node collapses to a dot when too small to read art.
  if (node.type === 'track' || screenR < AVATAR_MIN_SCREEN_RADIUS) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TWO_PI);
    ctx.fill();
  } else {
    paintAvatar(node, ctx, r, images.get(node.uri));
    ctx.lineWidth = 2 / scale;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TWO_PI);
    ctx.stroke();
  }

  if (screenR >= LABEL_MIN_SCREEN_RADIUS) paintLabel(node, ctx, scale, r, color);
};
