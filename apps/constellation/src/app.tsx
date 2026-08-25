import type { GraphNode } from './types';
import { t, loadTranslations } from './i18n';
import Inspector from './components/inspector';
import { useUpdateCheck } from '@shared/hooks';
import TypeFilter from './components/type-filter';
import GraphGuide from './components/graph-guide';
import { toSnapshot } from './graph/graph-snapshot';
import NodeSearchBox from './components/node-search-box';
import { downloadJson, downloadBlob } from '@shared/lib';
import { useGraphLenses } from './hooks/use-graph-lenses';
import React, { useState, useEffect, useRef } from 'react';
import { useGraphExplorer } from './hooks/use-graph-explorer';
import { useGraphControls } from './hooks/use-graph-controls';
import GraphPlaceholder from './components/graph-placeholder';
import GraphNavControls from './components/graph-nav-controls';
import AddedSinceFilter from './components/added-since-filter';
import GraphExportToolbar from './components/graph-export-toolbar';
import GraphView, { type GraphViewHandle } from './graph/graph-view';
import { UpdateBanner, ErrorBoundary, ToggleChip } from '@ui/components';

const App = () => {
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const { library, failed, revision, expand, expanded, expandingUri } = useGraphExplorer();
  const controls = useGraphControls();
  const {
    visibleTypes,
    toggleType,
    sizeByDegree,
    toggleSizeLens,
    colorByCluster,
    toggleClusterLens,
    showCollaborations,
    toggleCollaborations,
    since,
    setSince,
    focusUri,
    focus,
    clearFocus,
  } = controls;
  const { nodeVisible, nodeColor, extraLinks, timeBounds } = useGraphLenses(
    library,
    revision,
    controls,
  );
  const viewRef = useRef<GraphViewHandle>(null);
  const updateUrl = useUpdateCheck(__APP_NAME__, __APP_VERSION__);

  const lenses = [
    { label: t('lens.byDegree'), active: sizeByDegree, onToggle: toggleSizeLens },
    { label: t('lens.byCluster'), active: colorByCluster, onToggle: toggleClusterLens },
    {
      label: t('edges.collaborations'),
      active: showCollaborations,
      onToggle: toggleCollaborations,
    },
  ];

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
        <div className="relative flex-1">
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
            onSelect={setSelected}
            onExpand={expand}
          />
          <div className="absolute start-3 top-3 z-10 flex w-72 flex-col gap-2">
            <NodeSearchBox
              graph={library.graph}
              revision={revision}
              isVisible={nodeVisible}
              onPick={focusOn}
            />
            <div className="flex flex-col gap-3 rounded-xl border border-spice-subtext/15 bg-spice-card/80 p-3 shadow-xl backdrop-blur-md">
              <TypeFilter visibleTypes={visibleTypes} onToggle={toggleType} />
              <div className="h-px bg-spice-subtext/10" />
              <div className="flex flex-wrap gap-1.5">
                {lenses.map((lens) => (
                  <ToggleChip key={lens.label} active={lens.active} onToggle={lens.onToggle}>
                    {lens.label}
                  </ToggleChip>
                ))}
              </div>
              {timeBounds && (
                <AddedSinceFilter
                  min={timeBounds.min}
                  max={timeBounds.max}
                  since={since}
                  onChange={setSince}
                />
              )}
            </div>
          </div>
          <GraphExportToolbar onExportImage={exportImage} onExportData={exportData} />
          <GraphNavControls onZoomIn={zoomIn} onZoomOut={zoomOut} onFit={fitView} />
          <GraphGuide />
        </div>
        <Inspector
          node={selected}
          graph={library.graph}
          expanded={expanded}
          expandingUri={expandingUri}
          focused={focusUri !== null}
          onExpand={expand}
          onFocus={focusNeighborhood}
          onSelect={focusOn}
          onClearFocus={clearFocus}
        />
      </>
    );
  };

  return (
    <ErrorBoundary scope={__APP_NAME__} title={t('app.error')}>
      {updateUrl && <UpdateBanner appName={__APP_NAME__} releaseUrl={updateUrl} />}
      <div className="absolute inset-0 flex">{renderBody()}</div>
    </ErrorBoundary>
  );
};

export default App;
