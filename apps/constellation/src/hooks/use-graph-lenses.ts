import { subgraph } from '../graph/music-graph';
import type { GraphView } from './use-graph-view';
import { clusterColor } from '../graph/node-style';
import { useGraphPalette } from './use-graph-palette';
import { pathsBetween } from '../graph/paths-between';
import { blockCutTree } from '../graph/block-cut-tree';
import type { RenderNode } from '../graph/render-data';
import { deriveCollaborations } from '../graph/collaboration';
import { useMemo, useCallback, useDeferredValue } from 'react';
import { detectCommunities } from '../graph/community-detection';
import type { NodeType, GraphNode, GraphEdge } from '../types/graph';
import {
  adjacencyOf,
  reachableFrom,
  addedAtBounds,
  neighborhoodUris,
  countVisibleNeighbors,
} from '../graph/node-query';

const NO_LINKS: GraphEdge[] = [];

const MIN_LINKS = 2;

const NO_URIS: string[] = [];

type Options = {
  view: GraphView;
  rootUri: string;
  hidden: string[];
  seeds: string[];
  /** Subtrees kept when their owner was removed. */
  keptUris: string[];
  visibleTypes: ReadonlySet<NodeType>;
  since: number;
  colorByCluster: boolean;
  showCollaborations: boolean;
  connectedOnly: boolean;
  focusUri: string | null;
  markedUris: string[];
  pathMode: boolean;
  pathDetour: number;
};

/** Derivations key on the deferred `view`, so a burst of expansions recomputes once it settles. */
export const useGraphLenses = ({
  view,
  rootUri,
  hidden,
  seeds,
  keptUris,
  visibleTypes,
  since,
  colorByCluster,
  showCollaborations,
  connectedOnly,
  focusUri,
  markedUris,
  pathMode,
  pathDetour,
}: Options) => {
  const settled = useDeferredValue(view);
  const blocked = useMemo(() => new Set(hidden), [hidden]);
  const liveSet = useMemo(
    () => reachableFrom(settled.graph, [rootUri, ...seeds, ...keptUris], blocked),
    [settled, rootUri, seeds, keptUris, blocked],
  );

  const live = useMemo(
    () => ({ graph: hidden.length ? subgraph(settled.graph, liveSet) : settled.graph }),
    [settled, liveSet, hidden],
  );

  const focusSet = useMemo(
    () => (focusUri ? neighborhoodUris(settled.graph, focusUri) : null),
    [focusUri, settled],
  );

  const blocks = useMemo(() => (pathMode ? blockCutTree(live.graph) : null), [pathMode, live]);

  const pathSet = useMemo(
    () => (blocks ? pathsBetween(live.graph, blocks, markedUris, pathDetour) : null),
    [blocks, markedUris, pathDetour, live],
  );

  const liveNodes = useMemo(
    () => settled.graph.nodes().filter((node) => liveSet.has(node.uri)),
    [settled, liveSet],
  );

  const timeBounds = useMemo(() => addedAtBounds(liveNodes), [liveNodes]);

  const effectiveSince = timeBounds && since > timeBounds.max ? timeBounds.min : since;
  const filterSince = useDeferredValue(effectiveSince);

  const isShown = useCallback(
    (node: GraphNode) =>
      liveSet.has(node.uri) &&
      visibleTypes.has(node.type) &&
      (!focusSet || focusSet.has(node.uri)) &&
      (!pathSet || pathSet.has(node.uri)) &&
      (!node.addedAt || node.addedAt >= filterSince),
    [liveSet, visibleTypes, focusSet, pathSet, filterSince],
  );

  const extraLinks = useMemo(
    () => (showCollaborations ? deriveCollaborations(live.graph) : NO_LINKS),
    [showCollaborations, live],
  );

  const extraNeighbors = useMemo(() => adjacencyOf(extraLinks), [extraLinks]);

  const nodeVisible = useCallback(
    (node: GraphNode) => {
      if (!isShown(node)) return false;
      if (pathSet || !connectedOnly) return true;
      const extra = extraNeighbors.get(node.uri) ?? NO_URIS;
      return countVisibleNeighbors(settled.graph, node.uri, extra, isShown, MIN_LINKS) >= MIN_LINKS;
    },
    [isShown, connectedOnly, settled, pathSet, extraNeighbors],
  );

  const clusterColorByUri = useMemo(() => {
    if (!colorByCluster) return null;
    const colors = new Map<string, string>();
    for (const [uri, community] of detectCommunities(live.graph)) {
      colors.set(uri, clusterColor(community));
    }
    return colors;
  }, [colorByCluster, live]);

  const palette = useGraphPalette();
  const nodeColor = useCallback(
    (node: RenderNode) => clusterColorByUri?.get(node.uri) ?? palette.color[node.type],
    [clusterColorByUri, palette],
  );

  const visibleNodes = useMemo(
    () => settled.graph.nodes().filter(nodeVisible),
    [settled, nodeVisible],
  );
  const visibleUris = useMemo(() => new Set(visibleNodes.map((n) => n.uri)), [visibleNodes]);

  return {
    liveSet,
    liveNodes,
    visibleNodes,
    visibleUris,
    nodeColor,
    extraLinks,
    timeBounds,
    effectiveSince,
  };
};
