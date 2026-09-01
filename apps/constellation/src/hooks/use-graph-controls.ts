import { useCallback } from 'react';
import { toggleInSet } from '@shared/lib';
import { ALL_NODE_TYPES } from '../constants';
import type { NodeType, GraphNode } from '../types/graph';
import { usePersistentState, type Codec } from '@shared/hooks';

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

const usePersistentToggle = (key: string): [boolean, () => void] => {
  const [on, setOn] = usePersistentState(key, false);
  return [on, useCallback(() => setOn((prev) => !prev), [setOn])];
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
  const allTypesVisible = visibleTypes.size === ALL_NODE_TYPES.length;
  const isTypeVisible = useCallback(
    (node: GraphNode) => visibleTypes.has(node.type),
    [visibleTypes],
  );

  const [sizeByDegree, toggleSizeLens] = usePersistentToggle('sizeByDegree');
  const [colorByCluster, toggleClusterLens] = usePersistentToggle('colorByCluster');
  const [showCollaborations, toggleCollaborations] = usePersistentToggle('showCollaborations');
  const [connectedOnly, toggleConnectedOnly] = usePersistentToggle('connectedOnly');

  const [since, setSince] = usePersistentState('since', 0);

  const resetFilters = useCallback(() => {
    setVisibleTypes(new Set(ALL_NODE_TYPES));
    setSince(0);
    if (connectedOnly) toggleConnectedOnly();
  }, [setVisibleTypes, setSince, connectedOnly, toggleConnectedOnly]);

  const filtersActive = !allTypesVisible || since > 0 || connectedOnly;

  return {
    visibleTypes,
    toggleType,
    resetFilters,
    filtersActive,
    allTypesVisible,
    isTypeVisible,
    sizeByDegree,
    toggleSizeLens,
    colorByCluster,
    toggleClusterLens,
    showCollaborations,
    toggleCollaborations,
    connectedOnly,
    toggleConnectedOnly,
    since,
    setSince,
  };
};

export type GraphControls = ReturnType<typeof useGraphControls>;
