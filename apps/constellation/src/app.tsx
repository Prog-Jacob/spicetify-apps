import type { GraphNode } from './types';
import { t, loadTranslations } from './i18n';
import Inspector from './components/inspector';
import { useUpdateCheck } from '@shared/hooks';
import TypeFilter from './components/type-filter';
import { toSnapshot } from './graph/graph-snapshot';
import { neighborhoodUris } from './graph/node-query';
import NodeSearchBox from './components/node-search-box';
import { downloadJson, downloadBlob } from '@shared/lib';
import SizeLensToggle from './components/size-lens-toggle';
import { useGraphExplorer } from './hooks/use-graph-explorer';
import { useGraphControls } from './hooks/use-graph-controls';
import GraphExportToolbar from './components/graph-export-toolbar';
import GraphView, { type GraphViewHandle } from './graph/graph-view';
import { TextComponent, UpdateBanner, ErrorBoundary } from '@ui/components';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

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
  const {
    visibleTypes,
    toggleType,
    isVisible,
    sizeByDegree,
    toggleSizeLens,
    focusUri,
    focus,
    clearFocus,
  } = useGraphControls();
  const viewRef = useRef<GraphViewHandle>(null);
  const updateUrl = useUpdateCheck(__APP_NAME__, __APP_VERSION__);

  const focusSet = useMemo(
    () => (focusUri && library ? neighborhoodUris(library.graph, focusUri) : null),
    [focusUri, library, revision],
  );

  const nodeVisible = useCallback(
    (node: GraphNode) => isVisible(node) && (!focusSet || focusSet.has(node.uri)),
    [isVisible, focusSet],
  );

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

  return (
    <ErrorBoundary scope={__APP_NAME__} title={t('app.error')}>
      {updateUrl && <UpdateBanner appName={__APP_NAME__} releaseUrl={updateUrl} />}
      <div className="absolute inset-0 flex">
        {failed && !library ? (
          <Centered>{t('app.error')}</Centered>
        ) : !library ? (
          <Centered>{t('app.loading')}</Centered>
        ) : (
          <>
            <div className="relative flex-1">
              <GraphView
                ref={viewRef}
                graph={library.graph}
                images={library.images}
                revision={revision}
                nodeVisible={nodeVisible}
                sizeByDegree={sizeByDegree}
                onSelect={setSelected}
              />
              <div className="absolute left-3 top-3 z-10 flex w-64 flex-col gap-2">
                <NodeSearchBox
                  graph={library.graph}
                  revision={revision}
                  isVisible={nodeVisible}
                  onPick={focusOn}
                />
                <TypeFilter visibleTypes={visibleTypes} onToggle={toggleType} />
                <SizeLensToggle active={sizeByDegree} onToggle={toggleSizeLens} />
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
              onClearFocus={clearFocus}
            />
          </>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
