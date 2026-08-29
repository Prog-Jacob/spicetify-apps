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
) => {
  const { isTypeVisible, since, colorByCluster, showCollaborations, connectedOnly } = controls;
  const { focusUri, anchors, pathMode, pathDetour } = selection;
  const graph = library?.graph ?? null;

  const focusSet = useMemo(
    () => (focusUri && library ? neighborhoodUris(library.graph, focusUri) : null),
    [focusUri, library, revision],
  );

  const settledRevision = useDeferredValue(revision);

  const blocks = useMemo(
    () => (pathMode && library ? blockCutTree(library.graph) : null),
    [pathMode, library, settledRevision],
  );

  const pathSet = useMemo(
    () => (blocks && library ? pathsBetween(library.graph, blocks, anchors, pathDetour) : null),
    [blocks, anchors, pathDetour, library],
  );

  const timeBounds = useMemo(
    () => (library ? addedAtBounds(library.graph) : null),
    [library, settledRevision],
  );

  const effectiveSince = timeBounds && since > timeBounds.max ? timeBounds.min : since;

  const passesFilters = useCallback(
    (node: GraphNode) =>
      isTypeVisible(node) &&
      (!focusSet || focusSet.has(node.uri)) &&
      (!pathSet || pathSet.has(node.uri)) &&
      (!node.addedAt || node.addedAt >= effectiveSince),
    [isTypeVisible, focusSet, pathSet, effectiveSince],
  );

  const extraLinks = useMemo(
    () => (showCollaborations && library ? deriveCollaborations(library.graph) : NO_LINKS),
    [showCollaborations, library, settledRevision],
  );

  const extraNeighbors = useMemo(() => adjacencyOf(extraLinks), [extraLinks]);

  const nodeVisible = useCallback(
    (node: GraphNode) => {
      if (!passesFilters(node)) return false;
      if (pathSet || !connectedOnly || !graph) return true;
      const extra = extraNeighbors.get(node.uri) ?? NO_URIS;
      return countVisibleNeighbors(graph, node.uri, extra, passesFilters, MIN_LINKS) >= MIN_LINKS;
    },
    [passesFilters, connectedOnly, graph, pathSet, extraNeighbors],
  );

  const clusterColorByUri = useMemo(() => {
    if (!colorByCluster || !library) return null;
    const colors = new Map<string, string>();
    for (const [uri, community] of detectCommunities(library.graph)) {
      colors.set(uri, clusterColor(community));
    }
    return colors;
  }, [colorByCluster, library, settledRevision]);

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

  return { visibleNodes, visibleUris, nodeColor, extraLinks, timeBounds, effectiveSince };
};

export type GraphLenses = ReturnType<typeof useGraphLenses>;
