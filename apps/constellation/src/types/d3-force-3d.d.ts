declare module 'd3-force-3d' {
  type Force = ((alpha: number) => void) & {
    initialize?: (nodes: unknown[]) => void;
    radius(r: unknown): Force;
    strength(s: number): Force;
    iterations(n: number): Force;
    x(x: number): Force;
    y(y: number): Force;
  };
  export function forceCollide(radius?: unknown): Force;
  export function forceX(x?: number): Force;
  export function forceY(y?: number): Force;
}
