import { toggleInSet } from '@shared/lib';
import type { GraphNode } from '../types/graph';
import type { MusicGraph } from '../graph/music-graph';
import { useState, useMemo, useCallback } from 'react';
import { PATH_DETOUR } from '../graph/paths-between';

export const useGraphSelection = (graph: MusicGraph, revision: number) => {
  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const [focusUri, setFocusUri] = useState<string | null>(null);
  const [marked, setMarked] = useState<Set<string>>(() => new Set());
  const [pathRequested, setPathRequested] = useState(false);
  const [pathDetour, setPathDetour] = useState<number>(PATH_DETOUR.default);

  const selected = useMemo(
    () => (selectedUri ? (graph.node(selectedUri) ?? null) : null),
    [selectedUri, graph, revision],
  );

  const anchors = useMemo(
    () => [...marked].filter((uri) => graph.node(uri) !== undefined),
    [marked, graph, revision],
  );
  const liveMarked = useMemo(() => new Set(anchors), [anchors]);
  const pathMode = pathRequested && anchors.length >= 2;

  const select = useCallback((node: GraphNode | null) => {
    setSelectedUri(node?.uri ?? null);
    if (!node) setFocusUri(null);
  }, []);

  const clearFocus = useCallback(() => setFocusUri(null), []);
  const toggleMark = useCallback((uri: string) => setMarked((prev) => toggleInSet(prev, uri)), []);
  const clearMarks = useCallback(() => {
    setMarked((prev) => (prev.size ? new Set() : prev));
    setPathRequested(false);
  }, []);
  const togglePathMode = useCallback(() => setPathRequested((on) => !on), []);

  const clearAll = useCallback(() => {
    select(null);
    clearMarks();
  }, [select, clearMarks]);

  return {
    selected,
    select,
    focusUri: focusUri && graph.node(focusUri) ? focusUri : null,
    focus: setFocusUri,
    clearFocus,
    marked: liveMarked,
    anchors,
    toggleMark,
    clearMarks,
    clearAll,
    pathMode,
    togglePathMode,
    pathDetour,
    setPathDetour,
  };
};

export type GraphSelection = ReturnType<typeof useGraphSelection>;
