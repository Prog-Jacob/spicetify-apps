import React from 'react';
import { useAppReady } from '@shared/hooks';
import { t, loadTranslations } from './i18n';
import GraphWorkspace from './graph-workspace';
import { useGraphExplorer } from './hooks/use-graph-explorer';
import ConstellationArt from './components/constellation-art';
import { UpdateBanner, ErrorBoundary, EmptyState } from '@ui/components';

const ConstellationApp = () => {
  const explorer = useGraphExplorer();
  const { library, failed, crawlPhase, reload, recover } = explorer;

  const body = () => {
    if (failed && !library)
      return (
        <EmptyState
          art={<ConstellationArt />}
          title={t('app.error')}
          subtitle={t('app.errorSub')}
          action={{ label: t('app.retry'), onClick: reload }}
        />
      );
    if (!library)
      return (
        <EmptyState
          art={<ConstellationArt pulse />}
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
    <ErrorBoundary title={t('app.error')} onReset={recover}>
      <div className="absolute inset-0 flex flex-col overflow-hidden">
        <UpdateBanner className="shrink-0 px-3 pt-3" />
        <div className="flex min-h-0 flex-1 overflow-hidden">{body()}</div>
      </div>
    </ErrorBoundary>
  );
};

const App = () => (useAppReady(loadTranslations) ? <ConstellationApp /> : null);

export default App;
