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
  const showAllTypes = useCallback(
    () => setVisibleTypes(new Set(ALL_NODE_TYPES)),
    [setVisibleTypes],
  );
  const allTypesVisible = visibleTypes.size === ALL_NODE_TYPES.length;
  const isVisible = useCallback((node: GraphNode) => visibleTypes.has(node.type), [visibleTypes]);

  const [sizeByDegree, toggleSizeLens] = usePersistentToggle('sizeByDegree');
  const [colorByCluster, toggleClusterLens] = usePersistentToggle('colorByCluster');
  const [showCollaborations, toggleCollaborations] = usePersistentToggle('showCollaborations');
  const [showHubsOnly, toggleHubsOnly] = usePersistentToggle('connectedOnly');

  const [since, setSince] = usePersistentState('since', 0);

  const [focusUri, setFocusUri] = useState<string | null>(null);
  const clearFocus = useCallback(() => setFocusUri(null), []);

  return {
    visibleTypes,
    toggleType,
    showAllTypes,
    allTypesVisible,
    isVisible,
    sizeByDegree,
    toggleSizeLens,
    colorByCluster,
    toggleClusterLens,
    showCollaborations,
    toggleCollaborations,
    showHubsOnly,
    toggleHubsOnly,
    since,
    setSince,
    focusUri,
    focus: setFocusUri,
    clearFocus,
  };
};
