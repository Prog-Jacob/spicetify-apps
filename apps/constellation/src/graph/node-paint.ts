import type { GraphPalette } from './theme';
import type { RenderNode } from './render-data';
import { monogram, AVATAR_MIN_SCREEN_RADIUS } from './node-style';

const TWO_PI = Math.PI * 2;

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
    ctx.fillText(monogram(node.label), x, y + 0.5);
  }
  ctx.restore();
};

export const paintNode = (
  node: RenderNode,
  ctx: CanvasRenderingContext2D,
  scale: number,
  palette: GraphPalette,
  images: Map<string, string>,
) => {
  const r = node.radius;
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
