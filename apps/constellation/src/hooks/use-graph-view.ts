import { useMemo } from 'react';
import type { MusicGraph } from '../graph/music-graph';

/** The graph mutates in place, so its identity can't key a memo; this handle is new per revision. */
export type GraphView = { readonly graph: MusicGraph };

export const useGraphView = (graph: MusicGraph, revision: number): GraphView =>
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `revision` is the graph's mutation counter
  useMemo(() => ({ graph }), [graph, revision]);
