import type { GraphNode } from './types';
import { t, loadTranslations } from './i18n';
import Inspector from './components/inspector';
import { useUpdateCheck } from '@shared/hooks';
import TypeFilter from './components/type-filter';
import ToggleChip from './components/toggle-chip';
import { toSnapshot } from './graph/graph-snapshot';
import NodeSearchBox from './components/node-search-box';
import { downloadJson, downloadBlob } from '@shared/lib';
import { useGraphLenses } from './hooks/use-graph-lenses';
import React, { useState, useEffect, useRef } from 'react';
import { useGraphExplorer } from './hooks/use-graph-explorer';
import { useGraphControls } from './hooks/use-graph-controls';
import AddedSinceFilter from './components/added-since-filter';
import GraphExportToolbar from './components/graph-export-toolbar';
import GraphView, { type GraphViewHandle } from './graph/graph-view';
import { TextComponent, UpdateBanner, ErrorBoundary } from '@ui/components';

const Centered = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-full w-full items-center justify-center">
    <TextComponent variant="ballad" semanticColor="textSubdued">
      {children}
    </TextComponent>
  </div>
);

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
    if (failed && !library) return <Centered>{t('app.error')}</Centered>;
    if (!library) return <Centered>{t('app.loading')}</Centered>;
    if (library.graph.isEmpty()) return <Centered>{t('app.empty')}</Centered>;
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
            onSelect={setSelected}
          />
          <div className="absolute start-3 top-3 z-10 flex w-64 flex-col gap-2">
            <NodeSearchBox
              graph={library.graph}
              revision={revision}
              isVisible={nodeVisible}
              onPick={focusOn}
            />
            <TypeFilter visibleTypes={visibleTypes} onToggle={toggleType} />
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
          <GraphExportToolbar onExportImage={exportImage} onExportData={exportData} />
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
