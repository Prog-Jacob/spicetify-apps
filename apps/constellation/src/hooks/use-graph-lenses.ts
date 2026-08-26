import { useGraphPalette } from '../graph/theme';
import { clusterColor } from '../graph/node-style';
import type { GraphNode, GraphEdge } from '../types';
import type { RenderNode } from '../graph/render-data';
import { useMemo, useEffect, useCallback } from 'react';
import type { useGraphControls } from './use-graph-controls';
import { deriveCollaborations } from '../graph/collaboration';
import type { LibraryGraph } from '../services/library-crawler';
import { detectCommunities } from '../graph/community-detection';
import { addedAtBounds, neighborhoodUris, hasVisibleDegreeOver } from '../graph/node-query';

const NO_LINKS: GraphEdge[] = [];

type Controls = ReturnType<typeof useGraphControls>;

export const useGraphLenses = (
  library: LibraryGraph | null,
  revision: number,
  controls: Controls,
) => {
  const { isVisible, focusUri, since, setSince, colorByCluster, showCollaborations, showHubsOnly } =
    controls;

  const focusSet = useMemo(
    () => (focusUri && library ? neighborhoodUris(library.graph, focusUri) : null),
    [focusUri, library, revision],
  );

  const graph = library?.graph ?? null;

  const timeBounds = useMemo(
    () => (library ? addedAtBounds(library.graph) : null),
    [library, revision],
  );

  useEffect(() => {
    if (timeBounds && since > timeBounds.max) setSince(timeBounds.min);
  }, [timeBounds, since, setSince]);

  const passesFilters = useCallback(
    (node: GraphNode) =>
      isVisible(node) &&
      (!focusSet || focusSet.has(node.uri)) &&
      (!node.addedAt || node.addedAt >= since),
    [isVisible, focusSet, since],
  );

  const nodeVisible = useCallback(
    (node: GraphNode) => {
      if (!passesFilters(node)) return false;
      if (!showHubsOnly || !graph) return true;
      return hasVisibleDegreeOver(graph, node.uri, passesFilters, 1);
    },
    [passesFilters, showHubsOnly, graph],
  );

  const clusterColorByUri = useMemo(() => {
    if (!colorByCluster || !library) return null;
    const colors = new Map<string, string>();
    for (const [uri, community] of detectCommunities(library.graph)) {
      colors.set(uri, clusterColor(community));
    }
    return colors;
  }, [colorByCluster, library, revision]);

  const palette = useGraphPalette();
  const nodeColor = useCallback(
    (node: RenderNode) => clusterColorByUri?.get(node.uri) ?? palette.color[node.type],
    [clusterColorByUri, palette],
  );

  const extraLinks = useMemo(
    () => (showCollaborations && library ? deriveCollaborations(library.graph) : NO_LINKS),
    [showCollaborations, library, revision],
  );

  return { nodeVisible, nodeColor, extraLinks, timeBounds };
};
