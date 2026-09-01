import { t, loadTranslations } from './i18n';
import GraphWorkspace from './graph-workspace';
import React, { useState, useEffect } from 'react';
import { UpdateBanner, ErrorBoundary } from '@ui/components';
import { useGraphExplorer } from './hooks/use-graph-explorer';
import GraphPlaceholder from './components/graph-placeholder';
import { useUpdateCheck, useSpicetifyReady } from '@shared/hooks';

const ConstellationApp = () => {
  const explorer = useGraphExplorer();
  const { library, failed, crawlPhase, reload } = explorer;
  const update = useUpdateCheck();

  const body = () => {
    if (failed && !library)
      return (
        <GraphPlaceholder
          title={t('app.error')}
          subtitle={t('app.errorSub')}
          action={{ label: t('app.retry'), onClick: reload }}
        />
      );
    if (!library)
      return (
        <GraphPlaceholder
          pulse
          title={t('app.loading')}
          subtitle={
            crawlPhase?.stage === 'profiles' && crawlPhase.total
              ? t('app.loadingProfiles', { done: crawlPhase.done ?? 0, total: crawlPhase.total })
              : t('app.loadingSub')
          }
        />
      );
    return <GraphWorkspace explorer={explorer} library={library} />;
  };

  return (
    <ErrorBoundary scope={__APP_NAME__} title={t('app.error')}>
      <div className="absolute inset-0 flex flex-col overflow-hidden">
        {update && (
          <UpdateBanner
            className="shrink-0 px-3 pt-3"
            releaseUrl={update.url}
            version={update.version}
          />
        )}
        <div className="flex min-h-0 flex-1 overflow-hidden">{body()}</div>
      </div>
    </ErrorBoundary>
  );
};

const App = () => {
  const spicetifyReady = useSpicetifyReady();
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    loadTranslations().finally(() => setI18nReady(true));
  }, []);

  return spicetifyReady && i18nReady ? <ConstellationApp /> : null;
};

export default App;
