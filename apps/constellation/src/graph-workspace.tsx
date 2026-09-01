import { t } from './i18n';
import Inspector from './components/inspector';
import type { GraphNode } from './types/graph';
import GraphDock from './components/graph-dock';
import { usePhysics } from './hooks/use-physics';
import { useReducedMotion } from '@shared/hooks';
import GraphGuide from './components/graph-guide';
import { neighborTypes } from './graph/node-query';
import SelectionBar from './components/selection-bar';
import { useGraphLenses } from './hooks/use-graph-lenses';
import { useGraphActions } from './hooks/use-graph-actions';
import React, { useRef, useMemo, useCallback } from 'react';
import { useGraphControls } from './hooks/use-graph-controls';
import GraphPlaceholder from './components/graph-placeholder';
import type { LibraryGraph } from './services/library-crawler';
import GraphNavControls from './components/graph-nav-controls';
import { useGraphSelection } from './hooks/use-graph-selection';
import type { GraphExplorer } from './hooks/use-graph-explorer';
import GraphExportToolbar from './components/graph-export-toolbar';
import GraphView, { type GraphViewHandle } from './graph/graph-view';

type Props = { explorer: GraphExplorer; library: LibraryGraph };

const GraphWorkspace = ({ explorer, library }: Props) => {
  const { revision, expand, expandingUri, pins, pinNode, unpinNode } = explorer;

  const controls = useGraphControls();
  const physics = usePhysics();
  const reducedMotion = useReducedMotion();
  const selection = useGraphSelection(library.graph, revision);
  const { selected, select, focusUri, focus, clearFocus } = selection;
  const lenses = useGraphLenses(
    library,
    revision,
    controls,
    selection,
    explorer.hidden,
    explorer.seeds,
    explorer.anchors,
  );

  const viewRef = useRef<GraphViewHandle>(null);

  const center = useCallback((uri: string) => viewRef.current?.focusNode(uri), []);

  const focusOn = useCallback(
    (node: GraphNode) => {
      select(node);
      center(node.uri);
    },
    [select, center],
  );

  const focusNeighborhood = useCallback(
    (node: GraphNode) => {
      focus(node.uri);
      center(node.uri);
    },
    [focus, center],
  );

  const { undoable, remove, removeOne, restoreOne, undoRemove, exportData, exportImage } =
    useGraphActions(explorer, library, lenses.liveNodes, viewRef);

  const filtersActive = controls.filtersActive || focusUri !== null || selection.pathMode;

  const clearEveryFilter = useCallback(() => {
    controls.resetFilters();
    clearFocus();
    if (selection.pathMode) selection.togglePathMode();
  }, [controls, clearFocus, selection]);

  const visibleCount = lenses.visibleNodes.length;
  const removeTypes = useMemo(
    () => [...neighborTypes(library.graph, selection.anchors)],
    [library.graph, selection.anchors],
  );

  return (
    <>
      <div className="relative min-w-0 flex-1 [--dock-w:18rem]">
        <GraphView
          ref={viewRef}
          graph={library.graph}
          images={library.images}
          revision={revision}
          visibleUris={lenses.visibleUris}
          nodeColor={lenses.nodeColor}
          extraLinks={lenses.extraLinks}
          sizeByDegree={controls.sizeByDegree}
          physics={physics.params}
          frozen={physics.frozen}
          marked={selection.marked}
          selectedUri={selected?.uri}
          expanded={library.expanded}
          expandingUri={expandingUri}
          pins={pins}
          reducedMotion={reducedMotion}
          aria-label={t('a11y.canvas', { nodes: visibleCount, links: library.graph.linkCount })}
          onSelect={select}
          onToggleMark={(node) => selection.toggleMark(node.uri)}
          onBackgroundClick={selection.clearAll}
          onExpand={expand}
          onPin={pinNode}
        />

        {/* Selection happens on a canvas, which announces nothing on its own. */}
        <span className="sr-only" aria-live="polite">
          {selected &&
            t('a11y.selected', {
              label: selected.label,
              type: t(`type.${selected.type}`),
              count: library.graph.degree(selected.uri),
            })}
        </span>

        {visibleCount === 0 && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <GraphPlaceholder
              title={t('filters.noneVisibleTitle')}
              subtitle={t('filters.noneVisible')}
              className="pointer-events-auto"
              action={{ label: t('filters.reset'), onClick: clearEveryFilter }}
            />
          </div>
        )}

        <GraphDock
          explorer={explorer}
          library={library}
          controls={controls}
          physics={physics}
          lenses={lenses}
          filtersActive={filtersActive}
          onResetFilters={clearEveryFilter}
          onFocus={focusOn}
          onRemove={removeOne}
          onRestore={restoreOne}
        />

        <div className="animate-fade-in-up absolute end-3 top-3 z-10">
          <GraphExportToolbar onExportImage={exportImage} onExportData={exportData} />
        </div>

        <div className="animate-fade-in-up absolute bottom-4 start-3 z-30">
          <GraphGuide />
        </div>

        <div className="animate-fade-in-up absolute bottom-4 end-3 z-10">
          <GraphNavControls
            onZoomIn={() => viewRef.current?.zoomBy(1.4)}
            onZoomOut={() => viewRef.current?.zoomBy(1 / 1.4)}
            onFit={() => viewRef.current?.fitView()}
          />
        </div>

        {(selection.marked.size > 0 || undoable.length > 0) && (
          <div className="pointer-events-none absolute inset-x-3 bottom-4 z-10 flex justify-center [&>*]:pointer-events-auto md:start-[calc(var(--dock-w)+1.5rem)] md:end-32">
            <SelectionBar
              count={selection.marked.size}
              undoCount={undoable.length}
              pathMode={selection.pathMode}
              onTogglePath={selection.togglePathMode}
              detour={selection.pathDetour}
              onDetourChange={selection.setPathDetour}
              removeTypes={removeTypes}
              onRemove={(keep) => {
                remove(selection.anchors, keep);
                selection.clearMarks();
              }}
              onUndo={undoRemove}
              onClear={selection.clearMarks}
            />
          </div>
        )}
      </div>

      {selected && (
        <Inspector
          node={selected}
          graph={library.graph}
          revision={revision}
          images={library.images}
          expanded={library.expanded}
          expandingUri={expandingUri}
          focused={focusUri === selected.uri}
          pinned={selected.uri in pins}
          marked={selection.marked.has(selected.uri)}
          onExpand={expand}
          onFocus={focusNeighborhood}
          onSelect={focusOn}
          onToggleMark={() => selection.toggleMark(selected.uri)}
          onClearFocus={clearFocus}
          onUnpin={() => unpinNode(selected.uri)}
          onRemove={removeOne}
          onClose={() => select(null)}
        />
      )}
    </>
  );
};

export default GraphWorkspace;
