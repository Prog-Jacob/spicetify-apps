import { toggleInSet } from '@shared/lib';
import { useState, useMemo, useCallback } from 'react';
import { PATH_RADIUS } from '../graph/common-neighborhood';

export const useMarkedNodes = () => {
  const [marked, setMarked] = useState<Set<string>>(() => new Set());
  const [pathMode, setPathMode] = useState(false);
  const [pathRadius, setPathRadius] = useState<number>(PATH_RADIUS.default);

  const toggle = useCallback((uri: string) => setMarked((prev) => toggleInSet(prev, uri)), []);
  const clear = useCallback(() => {
    setMarked(new Set());
    setPathMode(false);
  }, []);
  const togglePathMode = useCallback(() => setPathMode((p) => !p), []);

  const anchors = useMemo(() => [...marked], [marked]);

  return { marked, anchors, toggle, clear, pathMode, togglePathMode, pathRadius, setPathRadius };
};
