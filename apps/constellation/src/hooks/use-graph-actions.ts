import { t } from '../i18n';
import { toSnapshot } from '../graph/graph-snapshot';
import type { MusicGraph } from '../graph/music-graph';
import type { NodeType, GraphNode } from '../types/graph';
import type { GraphViewHandle } from '../components/graph-view';
import { useState, useEffect, useCallback, type RefObject } from 'react';
import { downloadJson, downloadBlob, notifyError, notifyDone } from '@shared/lib';

const UNDO_WINDOW_MS = 12_000;

/** Hide/restore behind a short undo window, plus the JSON and PNG exports. */
export const useGraphActions = ({
  graph,
  liveSet,
  viewRef,
  removeEntities,
  restoreEntities,
}: {
  graph: MusicGraph;
  liveSet: Set<string>;
  viewRef: RefObject<GraphViewHandle | null>;
  removeEntities: (uris: string[], keep?: ReadonlySet<NodeType>) => string[];
  restoreEntities: (uris: string[]) => void;
}) => {
  const [undoable, setUndoable] = useState<string[]>([]);

  const remove = useCallback(
    (uris: string[], keep?: ReadonlySet<NodeType>) => {
      const hidden = removeEntities(uris, keep);
      if (!hidden.length) return;
      setUndoable((prev) => [...prev, ...hidden]);
      notifyDone(t('manage.removedToast', { count: hidden.length }));
    },
    [removeEntities],
  );

  const removeOne = useCallback(
    (node: GraphNode, keep?: ReadonlySet<NodeType>) => remove([node.uri], keep),
    [remove],
  );

  const restoreOne = useCallback(
    (uri: string) => {
      restoreEntities([uri]);
      setUndoable((prev) => prev.filter((u) => u !== uri));
    },
    [restoreEntities],
  );

  useEffect(() => {
    if (!undoable.length) return;
    const timer = setTimeout(() => setUndoable([]), UNDO_WINDOW_MS);
    return () => clearTimeout(timer);
  }, [undoable]);

  const undoRemove = useCallback(() => {
    restoreEntities(undoable);
    setUndoable([]);
  }, [restoreEntities, undoable]);

  const exportData = useCallback(() => {
    downloadJson(toSnapshot(graph, liveSet), 'constellation.json');
    notifyDone(t('actions.exportSaved'));
  }, [graph, liveSet]);

  const exportImage = useCallback(async () => {
    try {
      const blob = await viewRef.current?.capturePng();
      if (!blob) throw new Error(t('actions.imageEmpty'));
      downloadBlob(blob, 'constellation.png');
      notifyDone(t('actions.exportSaved'));
    } catch (e) {
      notifyError(e, t('actions.imageFailed'));
    }
  }, [viewRef]);

  return { undoable, remove, removeOne, restoreOne, undoRemove, exportData, exportImage };
};
