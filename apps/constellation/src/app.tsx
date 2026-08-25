import type { GraphNode } from './types';
import GraphView from './graph/graph-view';
import { t, loadTranslations } from './i18n';
import Inspector from './components/inspector';
import { useUpdateCheck } from '@shared/hooks';
import React, { useState, useEffect } from 'react';
import { useGraphExplorer } from './hooks/use-graph-explorer';
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
  const updateUrl = useUpdateCheck(__APP_NAME__, __APP_VERSION__);

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
                graph={library.graph}
                images={library.images}
                revision={revision}
                onSelect={setSelected}
              />
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
