import { subgraph } from '../graph/music-graph';
import { useGraphPalette } from '../graph/theme';
import { clusterColor } from '../graph/node-style';
import { pathsBetween } from '../graph/paths-between';
import { blockCutTree } from '../graph/block-cut-tree';
import type { RenderNode } from '../graph/render-data';
import type { GraphControls } from './use-graph-controls';
import type { GraphNode, GraphEdge } from '../types/graph';
import type { GraphSelection } from './use-graph-selection';
import { deriveCollaborations } from '../graph/collaboration';
import { useMemo, useCallback, useDeferredValue } from 'react';
import type { LibraryGraph } from '../services/library-crawler';
import { detectCommunities } from '../graph/community-detection';
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

export const useGraphLenses = (
  library: LibraryGraph | null,
  revision: number,
  controls: GraphControls,
  selection: GraphSelection,
  hidden: string[],
  seeds: string[],
  anchorUris: string[],
) => {
  const { isTypeVisible, since, colorByCluster, showCollaborations, connectedOnly } = controls;
  const { focusUri, anchors, pathMode, pathDetour } = selection;
  const graph = library?.graph ?? null;

  const settledRevision = useDeferredValue(revision);
  const blocked = useMemo(() => new Set(hidden), [hidden]);
  const liveSet = useMemo(
    () =>
      library
        ? reachableFrom(library.graph, [library.rootUri, ...seeds, ...anchorUris], blocked)
        : null,
    [library, seeds, anchorUris, blocked, settledRevision],
  );

  const liveGraph = useMemo(
    () =>
      library && liveSet
        ? hidden.length
          ? subgraph(library.graph, liveSet)
          : library.graph
        : null,
    [library, liveSet, hidden, settledRevision],
  );

  const focusSet = useMemo(
    () => (focusUri && library ? neighborhoodUris(library.graph, focusUri) : null),
    [focusUri, library, revision],
  );

  const blocks = useMemo(
    () => (pathMode && liveGraph ? blockCutTree(liveGraph) : null),
    [pathMode, liveGraph],
  );

  const pathSet = useMemo(
    () => (blocks && liveGraph ? pathsBetween(liveGraph, blocks, anchors, pathDetour) : null),
    [blocks, anchors, pathDetour, liveGraph],
  );

  const liveNodes = useMemo(
    () => (graph && liveSet ? graph.nodes().filter((node) => liveSet.has(node.uri)) : []),
    [graph, liveSet, settledRevision],
  );

  const timeBounds = useMemo(() => addedAtBounds(liveNodes), [liveNodes]);

  const effectiveSince = timeBounds && since > timeBounds.max ? timeBounds.min : since;
  const filterSince = useDeferredValue(effectiveSince);

  const passesFilters = useCallback(
    (node: GraphNode) =>
      isTypeVisible(node) &&
      (!focusSet || focusSet.has(node.uri)) &&
      (!pathSet || pathSet.has(node.uri)) &&
      (!node.addedAt || node.addedAt >= filterSince),
    [isTypeVisible, focusSet, pathSet, filterSince],
  );

  const isShown = useCallback(
    (node: GraphNode) => !!liveSet?.has(node.uri) && passesFilters(node),
    [liveSet, passesFilters],
  );

  const extraLinks = useMemo(
    () => (showCollaborations && liveGraph ? deriveCollaborations(liveGraph) : NO_LINKS),
    [showCollaborations, liveGraph],
  );

  const extraNeighbors = useMemo(() => adjacencyOf(extraLinks), [extraLinks]);

  const nodeVisible = useCallback(
    (node: GraphNode) => {
      if (!isShown(node)) return false;
      if (pathSet || !connectedOnly || !graph) return true;
      const extra = extraNeighbors.get(node.uri) ?? NO_URIS;
      return countVisibleNeighbors(graph, node.uri, extra, isShown, MIN_LINKS) >= MIN_LINKS;
    },
    [isShown, connectedOnly, graph, pathSet, extraNeighbors],
  );

  const clusterColorByUri = useMemo(() => {
    if (!colorByCluster || !liveGraph) return null;
    const colors = new Map<string, string>();
    for (const [uri, community] of detectCommunities(liveGraph)) {
      colors.set(uri, clusterColor(community));
    }
    return colors;
  }, [colorByCluster, liveGraph]);

  const palette = useGraphPalette();
  const nodeColor = useCallback(
    (node: RenderNode) => clusterColorByUri?.get(node.uri) ?? palette.color[node.type],
    [clusterColorByUri, palette],
  );

  const visibleNodes = useMemo(
    () => (graph ? graph.nodes().filter(nodeVisible) : []),
    [graph, settledRevision, nodeVisible],
  );
  const visibleUris = useMemo(() => new Set(visibleNodes.map((n) => n.uri)), [visibleNodes]);

  return {
    liveNodes,
    visibleNodes,
    visibleUris,
    nodeColor,
    extraLinks,
    timeBounds,
    effectiveSince,
  };
};

export type GraphLenses = ReturnType<typeof useGraphLenses>;
