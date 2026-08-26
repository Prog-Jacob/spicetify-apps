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

export type PhysicsParams = {
  repulsion: number;
  linkLength: number;
  gravity: number;
  spacing: number;
};

type Knob = { min: number; max: number; step: number; default: number };

export const PHYSICS: Record<keyof PhysicsParams, Knob> = {
  repulsion: { min: 20, max: 400, step: 5, default: 140 },
  linkLength: { min: 0.4, max: 2.5, step: 0.05, default: 1 },
  gravity: { min: 0, max: 0.3, step: 0.005, default: 0.055 },
  spacing: { min: 0, max: 20, step: 1, default: 4 },
};

export const PHYSICS_DEFAULTS = Object.fromEntries(
  Object.entries(PHYSICS).map(([key, knob]) => [key, knob.default]),
) as PhysicsParams;

const VELOCITY_DECAY = 0.42;

export const applyForces = (
  fg: ForceGraph<RenderNode, RenderLink>,
  params: PhysicsParams,
  radiusFor: (node: RenderNode) => number,
): void => {
  fg.d3Force('charge')?.strength(-params.repulsion).distanceMax(300).theta(0.9);

  const link = fg.d3Force('link');
  if (link) link.distance((l: RenderLink) => (LINK_DISTANCE[l.type] ?? 40) * params.linkLength);

  fg.d3Force('x', forceX(0).strength(params.gravity));
  fg.d3Force('y', forceY(0).strength(params.gravity));

  fg.d3Force(
    'collide',
    forceCollide((n: RenderNode) => radiusFor(n) + params.spacing).iterations(1),
  );
  fg.d3VelocityDecay(VELOCITY_DECAY);
};
