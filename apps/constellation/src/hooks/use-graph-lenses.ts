import { graphPalette } from '../graph/theme';
import { clusterColor } from '../graph/node-style';
import type { GraphNode, GraphEdge } from '../types';
import type { RenderNode } from '../graph/render-data';
import type { useGraphControls } from './use-graph-controls';
import { deriveCollaborations } from '../graph/collaboration';
import { useMemo, useCallback, useDeferredValue } from 'react';
import type { LibraryGraph } from '../services/library-crawler';
import { detectCommunities } from '../graph/community-detection';
import { addedAtBounds, neighborhoodUris } from '../graph/node-query';

const NO_LINKS: GraphEdge[] = [];

type Controls = ReturnType<typeof useGraphControls>;

export const useGraphLenses = (
  library: LibraryGraph | null,
  revision: number,
  controls: Controls,
) => {
  const { isVisible, focusUri, since, colorByCluster, showCollaborations } = controls;

  const focusSet = useMemo(
    () => (focusUri && library ? neighborhoodUris(library.graph, focusUri) : null),
    [focusUri, library, revision],
  );

  const timeBounds = useMemo(
    () => (library ? addedAtBounds(library.graph) : null),
    [library, revision],
  );

  const deferredSince = useDeferredValue(since);
  const nodeVisible = useCallback(
    (node: GraphNode) =>
      isVisible(node) &&
      (!focusSet || focusSet.has(node.uri)) &&
      (!node.addedAt || node.addedAt >= deferredSince),
    [isVisible, focusSet, deferredSince],
  );

  const deferredRevision = useDeferredValue(revision);
  const clusterColorByUri = useMemo(() => {
    if (!colorByCluster || !library) return null;
    const colors = new Map<string, string>();
    for (const [uri, community] of detectCommunities(library.graph)) {
      colors.set(uri, clusterColor(community));
    }
    return colors;
  }, [colorByCluster, library, deferredRevision]);

  const palette = graphPalette();
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
