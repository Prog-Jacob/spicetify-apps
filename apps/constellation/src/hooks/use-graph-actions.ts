import { t } from '../i18n';
import { toSnapshot } from '../graph/graph-snapshot';
import type { GraphExplorer } from './use-graph-explorer';
import type { NodeType, GraphNode } from '../types/graph';
import type { GraphViewHandle } from '../graph/graph-view';
import type { LibraryGraph } from '../services/library-crawler';
import { useState, useEffect, useCallback, type RefObject } from 'react';
import { downloadJson, downloadBlob, notifyError, notifyDone } from '@shared/lib';

const UNDO_WINDOW_MS = 12_000;

/** Hide/restore behind a short undo window, plus the JSON and PNG exports. */
export const useGraphActions = (
  explorer: GraphExplorer,
  library: LibraryGraph,
  liveNodes: readonly GraphNode[],
  viewRef: RefObject<GraphViewHandle | null>,
) => {
  const { removeEntities, restoreEntities } = explorer;
  const [undoable, setUndoable] = useState<string[]>([]);

  const remove = useCallback(
    (uris: string[], keep?: Set<NodeType>) => {
      const hidden = removeEntities(uris, keep);
      if (!hidden.length) return;
      setUndoable((prev) => [...prev, ...hidden]);
      notifyDone(t('manage.removedToast', { count: hidden.length }));
    },
    [removeEntities],
  );

  const removeOne = useCallback(
    (node: GraphNode, keep?: Set<NodeType>) => remove([node.uri], keep),
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
    const live = new Set(liveNodes.map((node) => node.uri));
    downloadJson(toSnapshot(library.graph, live), 'constellation.json');
    notifyDone(t('actions.exportSaved'));
  }, [library, liveNodes]);

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
