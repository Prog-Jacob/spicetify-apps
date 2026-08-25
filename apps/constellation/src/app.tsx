import { notifyError } from '@shared/lib';
import GraphView from './graph/graph-view';
import { t, loadTranslations } from './i18n';
import Inspector from './components/inspector';
import React, { useState, useEffect } from 'react';
import type { RenderNode } from './graph/render-data';
import { useUpdateCheck, useAbortController } from '@shared/hooks';
import { TextComponent, UpdateBanner, ErrorBoundary } from '@ui/components';
import { buildLibraryGraph, type LibraryGraph } from './services/library-crawler';

const Centered = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-full w-full items-center justify-center">
    <TextComponent variant="ballad" semanticColor="textSubdued">
      {children}
    </TextComponent>
  </div>
);

const App = () => {
  const [ready, setReady] = useState(false);
  const [library, setLibrary] = useState<LibraryGraph | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<RenderNode | null>(null);
  const updateUrl = useUpdateCheck(__APP_NAME__, __APP_VERSION__);
  const aborter = useAbortController();

  useEffect(() => {
    loadTranslations().finally(() => setReady(true));
  }, []);

  useEffect(() => {
    const { signal } = aborter.start();
    buildLibraryGraph(signal)
      .then(setLibrary)
      .catch((e) => {
        if (signal.aborted) return;
        setFailed(true);
        notifyError(e, t('app.error'));
      });
  }, [aborter]);

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
              <GraphView graph={library.graph} images={library.images} onSelect={setSelected} />
            </div>
            <Inspector node={selected} graph={library.graph} />
          </>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
