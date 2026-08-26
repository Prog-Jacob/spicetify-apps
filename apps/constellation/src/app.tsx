import type { GraphNode } from './types';
import { t, loadTranslations } from './i18n';
import Inspector from './components/inspector';
import { useUpdateCheck } from '@shared/hooks';
import GraphGuide from './components/graph-guide';
import { toSnapshot } from './graph/graph-snapshot';
import ControlPanel from './components/control-panel';
import NodeSearchBox from './components/node-search-box';
import { downloadJson, downloadBlob } from '@shared/lib';
import { useGraphLenses } from './hooks/use-graph-lenses';
import React, { useState, useEffect, useRef } from 'react';
import { UpdateBanner, ErrorBoundary } from '@ui/components';
import { useGraphExplorer } from './hooks/use-graph-explorer';
import { useGraphControls } from './hooks/use-graph-controls';
import GraphPlaceholder from './components/graph-placeholder';
import GraphNavControls from './components/graph-nav-controls';
import GraphExportToolbar from './components/graph-export-toolbar';
import GraphView, { type GraphViewHandle } from './graph/graph-view';

const App = () => {
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
    pins,
    pinNode,
    unpinNode,
    releaseAllPins,
  } = useGraphExplorer();
  const controls = useGraphControls();
  const { sizeByDegree, focusUri, focus, clearFocus } = controls;
  const { nodeVisible, nodeColor, extraLinks, timeBounds } = useGraphLenses(
    library,
    revision,
    controls,
  );
  const viewRef = useRef<GraphViewHandle>(null);
  const updateUrl = useUpdateCheck(__APP_NAME__, __APP_VERSION__);

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
            selectedUri={selected?.uri}
            expanded={expanded}
            pins={pins}
            onSelect={selectNode}
            onExpand={expand}
            onPin={pinNode}
          />
          <div className="animate-fade-in-up absolute start-3 top-3 z-10 flex w-72 flex-col gap-2">
            <NodeSearchBox
              graph={library.graph}
              revision={revision}
              isVisible={nodeVisible}
              onPick={focusOn}
            />
            <ControlPanel
              graph={library.graph}
              controls={controls}
              timeBounds={timeBounds}
              adding={adding}
              pinnedCount={Object.keys(pins).length}
              expandProgress={expandProgress}
              onAdd={addEntity}
              onAdded={focusOn}
              onExpandAll={() => expandAll(nodeVisible)}
              onCancelExpandAll={cancelExpandAll}
              onReleasePins={releaseAllPins}
            />
          </div>
          <div className="animate-fade-in-up [animation-delay:80ms]">
            <GraphExportToolbar onExportImage={exportImage} onExportData={exportData} />
          </div>
          <div className="animate-fade-in-up [animation-delay:120ms]">
            <GraphNavControls onZoomIn={zoomIn} onZoomOut={zoomOut} onFit={fitView} />
          </div>
          <GraphGuide />
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
            onClose={() => selectNode(null)}
          />
        )}
      </>
    );
  };

  return (
    <ErrorBoundary scope={__APP_NAME__} title={t('app.error')}>
      {updateUrl && <UpdateBanner appName={__APP_NAME__} releaseUrl={updateUrl} />}
      <div className="absolute inset-0 flex overflow-hidden">{renderBody()}</div>
    </ErrorBoundary>
  );
};

export default App;
