import { EDGE_TYPE } from '../constants';
import type { EdgeType } from '../types';
import type ForceGraph from 'force-graph';
import { forceCollide } from 'd3-force-3d';
import type { RenderNode, RenderLink } from './render-data';

const LINK_STRENGTH: Partial<Record<EdgeType, number>> = {
  [EDGE_TYPE.SAVED]: 0.03,
  [EDGE_TYPE.OWNS]: 0.04,
  [EDGE_TYPE.COLLABORATED]: 0.4,
  [EDGE_TYPE.RELATED_TO]: 0.5,
};
const LINK_DISTANCE: Partial<Record<EdgeType, number>> = {
  [EDGE_TYPE.SAVED]: 110,
  [EDGE_TYPE.OWNS]: 90,
  [EDGE_TYPE.CONTAINS]: 30,
};

export const configureForces = (fg: ForceGraph<RenderNode, RenderLink>): void => {
  fg.d3Force('charge')?.strength(-160).distanceMax(340).theta(0.9);
  const linkForce = fg.d3Force('link');
  if (linkForce) {
    linkForce.strength((link: RenderLink) => LINK_STRENGTH[link.type] ?? 1);
    linkForce.distance((link: RenderLink) => LINK_DISTANCE[link.type] ?? 22);
  }
  fg.d3Force('collide', forceCollide((node: RenderNode) => node.radius + 3).iterations(1));
  fg.d3VelocityDecay(0.28).warmupTicks(30);
};
