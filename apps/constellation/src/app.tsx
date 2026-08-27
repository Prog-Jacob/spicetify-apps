import type { GraphNode } from './types';
import { t, loadTranslations } from './i18n';
import Inspector from './components/inspector';
import { usePhysics } from './hooks/use-physics';
import GraphGuide from './components/graph-guide';
import ControlDock from './components/control-dock';
import { toSnapshot } from './graph/graph-snapshot';
import SelectionBar from './components/selection-bar';
import NodeSearchBox from './components/node-search-box';
import { downloadJson, downloadBlob } from '@shared/lib';
import { useGraphLenses } from './hooks/use-graph-lenses';
import { useMarkedNodes } from './hooks/use-marked-nodes';
import React, { useState, useEffect, useRef } from 'react';
import { UpdateBanner, ErrorBoundary } from '@ui/components';
import { useGraphExplorer } from './hooks/use-graph-explorer';
import { useGraphControls } from './hooks/use-graph-controls';
import GraphPlaceholder from './components/graph-placeholder';
import GraphNavControls from './components/graph-nav-controls';
import { useUpdateCheck, useSpicetifyReady } from '@shared/hooks';
import GraphExportToolbar from './components/graph-export-toolbar';
import GraphView, { type GraphViewHandle } from './graph/graph-view';

const ConstellationApp = () => {
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const {
    library,
    failed,
    revision,
    expand,
    expanded,
    expandingUri,
    expandAll,
    cancelExpandAll,
    expandProgress,
    addEntity,
    adding,
    removeEntity,
    restoreEntity,
    removed,
    pins,
    pinNode,
    unpinNode,
    releaseAllPins,
  } = useGraphExplorer();
  const controls = useGraphControls();
  const physics = usePhysics();
  const marks = useMarkedNodes();
  const { sizeByDegree, focusUri, focus, clearFocus } = controls;

  const { nodeVisible, nodeColor, extraLinks, timeBounds } = useGraphLenses(
    library,
    revision,
    controls,
    marks.anchors,
    marks.pathMode,
    marks.pathRadius,
  );
  const viewRef = useRef<GraphViewHandle>(null);
  const update = useUpdateCheck();

  const focusOn = (node: GraphNode) => {
    setSelected(node);
    viewRef.current?.focusNode(node.uri);
  };

  const focusNeighborhood = (node: GraphNode) => {
    focus(node.uri);
    viewRef.current?.focusNode(node.uri);
  };

  const zoomIn = () => viewRef.current?.zoomBy(1.4);
  const zoomOut = () => viewRef.current?.zoomBy(0.72);
  const fitView = () => viewRef.current?.fitView();

  const exportData = () => library && downloadJson(toSnapshot(library.graph), 'constellation.json');
  const exportImage = async () => {
    const blob = await viewRef.current?.capturePng();
    if (blob) downloadBlob(blob, 'constellation.png');
  };

  useEffect(() => {
    loadTranslations().finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  const selectNode = (node: GraphNode | null) => {
    setSelected(node);
    if (!node) clearFocus();
  };

  const clearMarksAndSelection = () => {
    selectNode(null);
    marks.clear();
  };

  const removeMarked = () => {
    if (!library) return;
    for (const uri of marks.anchors) {
      const node = library.graph.node(uri);
      if (node) removeEntity(node);
    }
    if (selected && marks.marked.has(selected.uri)) selectNode(null);
    marks.clear();
  };

  const renderBody = () => {
    if (failed && !library)
      return (
        <GraphPlaceholder
          title={t('app.error')}
          subtitle={t('app.errorSub')}
          action={{ label: t('app.retry'), onClick: () => location.reload() }}
        />
      );
    if (!library)
      return <GraphPlaceholder pulse title={t('app.loading')} subtitle={t('app.loadingSub')} />;
    if (library.graph.isEmpty())
      return <GraphPlaceholder title={t('app.emptyTitle')} subtitle={t('app.empty')} />;
    return (
      <>
        <div className="relative min-w-0 flex-1">
          <GraphView
            ref={viewRef}
            graph={library.graph}
            images={library.images}
            revision={revision}
            nodeVisible={nodeVisible}
            nodeColor={nodeColor}
            extraLinks={extraLinks}
            sizeByDegree={sizeByDegree}
            physics={physics.physics}
            frozen={physics.frozen}
            marked={marks.marked}
            selectedUri={selected?.uri}
            expanded={expanded}
            pins={pins}
            onSelect={selectNode}
            onToggleMark={(node) => marks.toggle(node.uri)}
            onBackgroundClick={clearMarksAndSelection}
            onExpand={expand}
            onPin={pinNode}
          />
          <div className="animate-fade-in-up absolute bottom-14 start-3 top-3 z-10 flex w-72 flex-col gap-2">
            <NodeSearchBox
              graph={library.graph}
              revision={revision}
              isVisible={nodeVisible}
              onPick={focusOn}
            />
            <ControlDock
              graph={library.graph}
              physics={physics}
              view={{
                controls,
                timeBounds,
                pinnedCount: Object.keys(pins).length,
                expandProgress,
                onExpandAll: () => expandAll(nodeVisible),
                onCancelExpandAll: cancelExpandAll,
                onReleasePins: releaseAllPins,
              }}
              nodes={{
                graph: library.graph,
                revision,
                removed,
                adding,
                onAdd: addEntity,
                onAdded: focusOn,
                onRemove: (node) => {
                  removeEntity(node);
                  if (selected?.uri === node.uri) selectNode(null);
                },
                onRestore: (uri) => void restoreEntity(uri),
                onSelect: focusOn,
              }}
            />
          </div>
          <div className="animate-fade-in-up absolute end-3 top-3 z-10 [animation-delay:80ms]">
            <GraphExportToolbar onExportImage={exportImage} onExportData={exportData} />
          </div>
          <div className="animate-fade-in-up absolute bottom-4 start-3 z-10 [animation-delay:120ms]">
            <GraphGuide />
          </div>
          <div className="animate-fade-in-up absolute bottom-4 end-3 z-10 [animation-delay:120ms]">
            <GraphNavControls onZoomIn={zoomIn} onZoomOut={zoomOut} onFit={fitView} />
          </div>
          {marks.marked.size > 0 && (
            <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
              <SelectionBar
                count={marks.marked.size}
                pathMode={marks.pathMode}
                onTogglePath={marks.togglePathMode}
                radius={marks.pathRadius}
                onRadiusChange={marks.setPathRadius}
                onRemove={removeMarked}
                onClear={marks.clear}
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
            expanded={expanded}
            expandingUri={expandingUri}
            focused={focusUri !== null}
            pinned={selected.uri in pins}
            onExpand={expand}
            onFocus={focusNeighborhood}
            onSelect={focusOn}
            onClearFocus={clearFocus}
            onUnpin={() => unpinNode(selected.uri)}
            onRemove={(node) => {
              removeEntity(node);
              selectNode(null);
            }}
            onClose={() => selectNode(null)}
          />
        )}
      </>
    );
  };

  return (
    <ErrorBoundary scope={__APP_NAME__} title={t('app.error')}>
      {update && (
        <div className="absolute inset-x-0 top-0 z-40">
          <UpdateBanner releaseUrl={update.url} version={update.version} />
        </div>
      )}
      <div className="absolute inset-0 flex overflow-hidden">{renderBody()}</div>
    </ErrorBoundary>
  );
};

const App = () => {
  const spicetifyReady = useSpicetifyReady();
  if (!spicetifyReady) return null;
  return <ConstellationApp />;
};

export default App;
