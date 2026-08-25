declare module 'd3-force-3d' {
  type Force = ((alpha: number) => void) & {
    initialize?: (nodes: unknown[]) => void;
    radius(r: unknown): Force;
    strength(s: number): Force;
    iterations(n: number): Force;
  };
  export function forceCollide(radius?: unknown): Force;
}
