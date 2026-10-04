import { t } from './i18n';
import { EmptyState } from '@ui/components';
import ViewTab from './components/view-tab';
import NodesTab from './components/nodes-tab';
import Inspector from './components/inspector';
import type { GraphNode } from './types/graph';
import { usePhysics } from './hooks/use-physics';
import { useReducedMotion } from '@shared/hooks';
import GraphGuide from './components/graph-guide';
import PhysicsTab from './components/physics-tab';
import { neighborTypes } from './graph/node-query';
import { canExpand } from './services/expand-node';
import ControlDock from './components/control-dock';
import { useGraphView } from './hooks/use-graph-view';
import SelectionBar from './components/selection-bar';
import NodeSearchBox from './components/node-search-box';
import { useGraphLenses } from './hooks/use-graph-lenses';
import { useGraphActions } from './hooks/use-graph-actions';
import { useGraphControls } from './hooks/use-graph-controls';
import type { LibraryGraph } from './services/library-crawler';
import GraphNavControls from './components/graph-nav-controls';
import { useGraphSelection } from './hooks/use-graph-selection';
import type { GraphExplorer } from './hooks/use-graph-explorer';
import React, { useId, useRef, useMemo, useCallback } from 'react';
import GraphExportToolbar from './components/graph-export-toolbar';
import GraphView, { type GraphViewHandle } from './components/graph-view';

type Props = { explorer: GraphExplorer; library: LibraryGraph };

const GraphWorkspace = ({ explorer, library }: Props) => {
  const { revision, expand, expandingUri, expandAll, pins, pinNode, unpinNode, hidden } = explorer;
  const { graph, rootUri, images, expanded } = library;

  const controls = useGraphControls();
  const { lenses: lensFlags, resetFilters } = controls;
  const physics = usePhysics();
  const reducedMotion = useReducedMotion();
  const view = useGraphView(graph, revision);
  const selection = useGraphSelection(view);
  const { select, focusUri, focus, clearFocus, toggleMark, pathMode, togglePathMode } = selection;
  const lenses = useGraphLenses({
    view,
    rootUri,
    hidden,
    seeds: explorer.seeds,
    keptUris: explorer.anchors,
    visibleTypes: controls.visibleTypes,
    since: controls.since,
    colorByCluster: lensFlags.colorByCluster,
    showCollaborations: lensFlags.showCollaborations,
    connectedOnly: lensFlags.connectedOnly,
    focusUri,
    markedUris: selection.anchors,
    pathMode,
    pathDetour: selection.pathDetour,
  });
  // a removed node stays selected, so Undo brings its inspector back
  const selected =
    selection.selected && lenses.liveSet.has(selection.selected.uri) ? selection.selected : null;

  const viewRef = useRef<GraphViewHandle>(null);
  const hintId = useId();

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

  const toggleNodeMark = useCallback((node: GraphNode) => toggleMark(node.uri), [toggleMark]);
  const unpin = useCallback((node: GraphNode) => unpinNode(node.uri), [unpinNode]);
  const closeInspector = useCallback(() => select(null), [select]);

  const { undoable, remove, removeOne, restoreOne, undoRemove, exportData, exportImage } =
    useGraphActions({
      graph,
      liveSet: lenses.liveSet,
      viewRef,
      removeEntities: explorer.removeEntities,
      restoreEntities: explorer.restoreEntities,
    });

  const filtersActive = controls.filtersActive || focusUri !== null || pathMode;

  const clearEveryFilter = useCallback(() => {
    resetFilters();
    clearFocus();
    if (pathMode) togglePathMode();
  }, [resetFilters, clearFocus, pathMode, togglePathMode]);

  const visibleCount = lenses.visibleNodes.length;
  const removeTypes = useMemo(
    () => [...neighborTypes(graph, selection.anchors)],
    [graph, selection.anchors],
  );
  const removed = useMemo(
    () => hidden.flatMap((uri) => view.graph.node(uri) ?? []),
    [hidden, view],
  );

  return (
    <>
      <div className="relative min-w-0 flex-1 [--dock-w:18rem]">
        <GraphView
          ref={viewRef}
          graph={graph}
          images={images}
          revision={revision}
          visibleUris={lenses.visibleUris}
          nodeColor={lenses.nodeColor}
          extraLinks={lenses.extraLinks}
          sizeByDegree={lensFlags.sizeByDegree}
          physics={physics.params}
          frozen={physics.frozen}
          marked={selection.marked}
          selectedUri={selected?.uri}
          expanded={expanded}
          expandingUri={expandingUri}
          pins={pins}
          reducedMotion={reducedMotion}
          aria-label={t('a11y.canvas', { nodes: visibleCount, links: graph.linkCount })}
          aria-describedby={hintId}
          onSelect={select}
          onToggleMark={toggleNodeMark}
          onBackgroundClick={selection.clearAll}
          onExpand={expand}
          onPin={pinNode}
        />
        <p id={hintId} className="sr-only">
          {t('guide.keyboard')}
        </p>

        {/* Selection happens on a canvas, which announces nothing on its own. */}
        <span className="sr-only" aria-live="polite">
          {selected &&
            t('a11y.selected', {
              label: selected.label,
              type: t(`type.${selected.type}`),
              count: graph.degree(selected.uri),
            })}
        </span>

        {visibleCount === 0 && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <EmptyState
              title={t('filters.noneVisibleTitle')}
              subtitle={t('filters.noneVisible')}
              className="pointer-events-auto"
              action={{ label: t('filters.reset'), onClick: clearEveryFilter }}
            />
          </div>
        )}

        <div className="animate-fade-in-up pointer-events-none absolute bottom-14 start-3 top-3 z-10 flex w-[var(--dock-w)] flex-col gap-2 [&>*]:pointer-events-auto">
          <NodeSearchBox nodes={lenses.visibleNodes} onPick={focusOn} />
          <ControlDock
            nodeCount={graph.size}
            linkCount={graph.linkCount}
            progress={explorer.expandProgress}
            onCancelExpandAll={explorer.cancelExpandAll}
            view={
              <ViewTab
                visibleTypes={controls.visibleTypes}
                onToggleType={controls.toggleType}
                lenses={lensFlags}
                onToggleLens={controls.toggleLens}
                timeBounds={lenses.timeBounds}
                since={lenses.effectiveSince}
                onSinceChange={controls.setSince}
                visibleNodes={lenses.visibleNodes}
                expanded={expanded}
                pinnedCount={Object.keys(pins).length}
                filtersActive={filtersActive}
                refreshing={explorer.crawlPhase !== null}
                onResetFilters={clearEveryFilter}
                onExpandAll={expandAll}
                onReleasePins={explorer.releaseAllPins}
                onReload={explorer.reload}
              />
            }
            physics={
              <PhysicsTab
                params={physics.params}
                frozen={physics.frozen}
                isDefault={physics.isDefault}
                onChange={physics.setParam}
                onToggleFrozen={physics.toggleFrozen}
                onReset={physics.reset}
              />
            }
            nodes={
              <NodesTab
                nodes={lenses.liveNodes}
                rootUri={rootUri}
                removed={removed}
                adding={explorer.adding}
                onAdd={explorer.addEntity}
                onAdded={focusOn}
                onRemove={removeOne}
                onRestore={restoreOne}
                onSelect={focusOn}
              />
            }
          />
        </div>

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
              pathMode={pathMode}
              onTogglePath={togglePathMode}
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
          view={view}
          image={images.get(selected.uri)}
          expandable={canExpand(selected) && !expanded.has(selected.uri)}
          expanding={expandingUri === selected.uri}
          focused={focusUri === selected.uri}
          pinned={selected.uri in pins}
          marked={selection.marked.has(selected.uri)}
          removable={selected.uri !== rootUri}
          onExpand={expand}
          onFocus={focusNeighborhood}
          onSelect={focusOn}
          onToggleMark={toggleNodeMark}
          onClearFocus={clearFocus}
          onUnpin={unpin}
          onRemove={removeOne}
          onClose={closeInspector}
        />
      )}
    </>
  );
};

export default GraphWorkspace;
