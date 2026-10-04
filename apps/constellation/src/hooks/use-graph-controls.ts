import { toggleInSet } from '@shared/lib';
import { useMemo, useCallback } from 'react';
import { ALL_NODE_TYPES } from '../constants';
import type { NodeType } from '../types/graph';
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

export type LensKey = 'sizeByDegree' | 'colorByCluster' | 'showCollaborations' | 'connectedOnly';
export type Lenses = Record<LensKey, boolean>;

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

  const [sizeByDegree, setSizeByDegree] = usePersistentState('sizeByDegree', false);
  const [colorByCluster, setColorByCluster] = usePersistentState('colorByCluster', false);
  const [showCollaborations, setShowCollaborations] = usePersistentState(
    'showCollaborations',
    false,
  );
  const [connectedOnly, setConnectedOnly] = usePersistentState('connectedOnly', false);
  const lenses = useMemo<Lenses>(
    () => ({ sizeByDegree, colorByCluster, showCollaborations, connectedOnly }),
    [sizeByDegree, colorByCluster, showCollaborations, connectedOnly],
  );
  const toggleLens = useCallback(
    (key: LensKey) =>
      ({
        sizeByDegree: setSizeByDegree,
        colorByCluster: setColorByCluster,
        showCollaborations: setShowCollaborations,
        connectedOnly: setConnectedOnly,
      })[key]((on) => !on),
    [setSizeByDegree, setColorByCluster, setShowCollaborations, setConnectedOnly],
  );

  const [since, setSince] = usePersistentState('since', 0);

  const resetFilters = useCallback(() => {
    setVisibleTypes(new Set(ALL_NODE_TYPES));
    setSince(0);
    setConnectedOnly(false);
  }, [setVisibleTypes, setSince, setConnectedOnly]);

  const filtersActive = visibleTypes.size !== ALL_NODE_TYPES.length || since > 0 || connectedOnly;

  return {
    visibleTypes,
    toggleType,
    lenses,
    toggleLens,
    since,
    setSince,
    resetFilters,
    filtersActive,
  };
};
