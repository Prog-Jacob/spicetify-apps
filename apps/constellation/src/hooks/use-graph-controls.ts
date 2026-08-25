import { toggleInSet } from '@shared/lib';
import { ALL_NODE_TYPES } from '../constants';
import { useState, useCallback } from 'react';
import type { NodeType, GraphNode } from '../types';

export const useGraphControls = () => {
  const [visibleTypes, setVisibleTypes] = useState<Set<NodeType>>(() => new Set(ALL_NODE_TYPES));

  const toggleType = useCallback((type: NodeType) => {
    setVisibleTypes((prev) => toggleInSet(prev, type));
  }, []);

  const isVisible = useCallback((node: GraphNode) => visibleTypes.has(node.type), [visibleTypes]);

  const [sizeByDegree, setSizeByDegree] = useState(false);
  const toggleSizeLens = useCallback(() => setSizeByDegree((on) => !on), []);

  const [focusUri, setFocusUri] = useState<string | null>(null);
  const focus = useCallback((uri: string) => setFocusUri(uri), []);
  const clearFocus = useCallback(() => setFocusUri(null), []);

  return {
    visibleTypes,
    toggleType,
    isVisible,
    sizeByDegree,
    toggleSizeLens,
    focusUri,
    focus,
    clearFocus,
  };
};
