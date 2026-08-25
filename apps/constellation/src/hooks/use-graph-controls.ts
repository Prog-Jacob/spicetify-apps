import { toggleInSet } from '@shared/lib';
import { ALL_NODE_TYPES } from '../constants';
import { useState, useCallback } from 'react';
import type { NodeType, GraphNode } from '../types';
import { usePersistentState, type Codec } from './use-persistent-state';

const typesCodec: Codec<Set<NodeType>> = {
  parse: (raw) => {
    const parsed: unknown = JSON.parse(raw);
    const valid = Array.isArray(parsed)
      ? parsed.filter((t): t is NodeType =>
          (ALL_NODE_TYPES as readonly string[]).includes(t as string),
        )
      : ALL_NODE_TYPES;
    return new Set(valid);
  },
  serialize: (set) => JSON.stringify([...set]),
};

export const useGraphControls = () => {
  const [visibleTypes, setVisibleTypes] = usePersistentState(
    'visibleTypes',
    new Set(ALL_NODE_TYPES),
    typesCodec,
  );
  const toggleType = useCallback(
    (type: NodeType) => setVisibleTypes((prev) => toggleInSet(prev, type)),
    [setVisibleTypes],
  );
  const isVisible = useCallback((node: GraphNode) => visibleTypes.has(node.type), [visibleTypes]);

  const [sizeByDegree, setSizeByDegree] = usePersistentState('sizeByDegree', false);
  const toggleSizeLens = useCallback(() => setSizeByDegree((on) => !on), [setSizeByDegree]);

  const [colorByCluster, setColorByCluster] = usePersistentState('colorByCluster', false);
  const toggleClusterLens = useCallback(() => setColorByCluster((on) => !on), [setColorByCluster]);

  const [showCollaborations, setShowCollaborations] = usePersistentState(
    'showCollaborations',
    false,
  );
  const toggleCollaborations = useCallback(
    () => setShowCollaborations((on) => !on),
    [setShowCollaborations],
  );

  const [since, setSince] = usePersistentState('since', 0);

  const [focusUri, setFocusUri] = useState<string | null>(null);
  const focus = useCallback((uri: string) => setFocusUri(uri), []);
  const clearFocus = useCallback(() => setFocusUri(null), []);

  return {
    visibleTypes,
    toggleType,
    isVisible,
    sizeByDegree,
    toggleSizeLens,
    colorByCluster,
    toggleClusterLens,
    showCollaborations,
    toggleCollaborations,
    since,
    setSince,
    focusUri,
    focus,
    clearFocus,
  };
};
