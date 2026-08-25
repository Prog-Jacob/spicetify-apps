import type { GraphNode } from './types';
import { t, loadTranslations } from './i18n';
import Inspector from './components/inspector';
import { useUpdateCheck } from '@shared/hooks';
import TypeFilter from './components/type-filter';
import { toSnapshot } from './graph/graph-snapshot';
import GraphActions from './components/graph-actions';
import NodeSearchBox from './components/node-search-box';
import { downloadJson, downloadBlob } from '@shared/lib';
import React, { useState, useEffect, useRef } from 'react';
import { useGraphExplorer } from './hooks/use-graph-explorer';
import { useGraphControls } from './hooks/use-graph-controls';
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
  const { visibleTypes, toggleType, isVisible } = useGraphControls();
  const viewRef = useRef<GraphViewHandle>(null);
  const updateUrl = useUpdateCheck(__APP_NAME__, __APP_VERSION__);

  const focusOn = (node: GraphNode) => {
    setSelected(node);
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
        {failed ? (
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
                nodeVisible={isVisible}
                onSelect={setSelected}
              />
              <div className="absolute left-3 top-3 z-10 flex w-64 flex-col gap-2">
                <NodeSearchBox
                  graph={library.graph}
                  revision={revision}
                  isVisible={isVisible}
                  onPick={focusOn}
                />
                <TypeFilter visibleTypes={visibleTypes} onToggle={toggleType} />
              </div>
              <GraphActions onExportImage={exportImage} onExportData={exportData} />
            </div>
            <Inspector
              node={selected}
              graph={library.graph}
              expanded={expanded}
              expandingUri={expandingUri}
              onExpand={expand}
            />
          </>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
