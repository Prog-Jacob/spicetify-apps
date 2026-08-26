import { EDGE_TYPE } from '../constants';
import type { EdgeType } from '../types';
import type ForceGraph from 'force-graph';
import { forceX, forceY, forceCollide } from 'd3-force-3d';
import type { RenderNode, RenderLink } from './render-data';

const LINK_DISTANCE: Partial<Record<EdgeType, number>> = {
  [EDGE_TYPE.SAVED]: 64,
  [EDGE_TYPE.OWNS]: 56,
  [EDGE_TYPE.CONTAINS]: 24,
  [EDGE_TYPE.ON_ALBUM]: 22,
  [EDGE_TYPE.PERFORMED_BY]: 30,
  [EDGE_TYPE.MADE_BY]: 34,
  [EDGE_TYPE.COLLABORATED]: 44,
  [EDGE_TYPE.RELATED_TO]: 44,
};

export const configureForces = (fg: ForceGraph<RenderNode, RenderLink>): void => {
  fg.d3Force('charge')?.strength(-140).distanceMax(300).theta(0.9);

  const link = fg.d3Force('link');
  if (link) link.distance((l: RenderLink) => LINK_DISTANCE[l.type] ?? 40);

  fg.d3Force('x', forceX(0).strength(0.055));
  fg.d3Force('y', forceY(0).strength(0.055));

  fg.d3Force('collide', forceCollide((n: RenderNode) => n.radius + 4).iterations(1));
  fg.d3VelocityDecay(0.42);
};
