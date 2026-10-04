/** Reads a CSS custom property off `<html>`, where Spicetify themes set `--spice-*`. */
export const cssVar = (name: string, fallback: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

/** Any CSS color at `alpha` opacity; valid wherever CSS colors are, canvas `fillStyle` included. */
export const withAlpha = (color: string, alpha: number): string =>
  `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`;
