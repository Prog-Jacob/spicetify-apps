import { paginate } from '@shared/api';
import React, { useState } from 'react';
import { errorMessage } from '@shared/lib';
import { t, loadTranslations } from './i18n';
import type { ProgressInfo } from '@shared/types';
import { useAppReady, useAbortController } from '@shared/hooks';
import {
  ErrorCard,
  PageShell,
  ResultCard,
  ProgressCard,
  UpdateBanner,
  ButtonPrimary,
  ErrorBoundary,
} from '@ui/components';

type Count =
  | { status: 'idle' }
  | { status: 'running'; progress: ProgressInfo }
  | { status: 'done'; total: number }
  | { status: 'error'; message: string };

/** Demo: reads every Liked Song page by page, with progress and cancel. Replace with your app. */
const LikedSongsCounter = () => {
  const [count, setCount] = useState<Count>({ status: 'idle' });
  const task = useAbortController();

  const start = async () => {
    const { signal } = task.start();
    const label = t('likes.progress');
    setCount({ status: 'running', progress: { current: 0, total: 0, label } });
    try {
      const tracks = await paginate((page) => Spicetify.Platform.LibraryAPI.getTracks(page), {
        context: 'LibraryAPI.getTracks',
        label,
        signal,
        onProgress: (progress) => setCount({ status: 'running', progress }),
      });
      setCount({ status: 'done', total: tracks.length });
    } catch (e) {
      if (!signal.aborted) setCount({ status: 'error', message: errorMessage(e) });
    }
  };

  const cancel = () => {
    task.abort();
    setCount({ status: 'idle' });
  };

  switch (count.status) {
    case 'idle':
      return (
        <ButtonPrimary className="self-start" onClick={start}>
          {t('likes.count')}
        </ButtonPrimary>
      );
    case 'running':
      return <ProgressCard progress={count.progress} onCancel={cancel} />;
    case 'done':
      return (
        <ResultCard
          variant="success"
          title={t('likes.result', { count: count.total })}
          actions={<ButtonPrimary onClick={start}>{t('likes.again')}</ButtonPrimary>}
        />
      );
    case 'error':
      return <ErrorCard title={t('likes.failed')} warnings={[count.message]} onRetry={start} />;
  }
};

const App = () => {
  if (!useAppReady(loadTranslations)) return null;

  return (
    <ErrorBoundary title={t('app.error')}>
      <PageShell
        title={t('app.title')}
        subtitle={t('app.subtitle')}
        version={__APP_VERSION__}
        banner={<UpdateBanner />}
      >
        <LikedSongsCounter />
      </PageShell>
    </ErrorBoundary>
  );
};

export default App;
