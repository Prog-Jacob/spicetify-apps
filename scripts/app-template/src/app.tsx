import { t, loadTranslations } from './i18n';
import { useUpdateCheck } from '@shared/hooks';
import React, { useState, useEffect } from 'react';
import { UpdateBanner, ErrorBoundary, PageShell } from '@ui/components';

const App = () => {
  const [ready, setReady] = useState(false);
  const update = useUpdateCheck();
  const banner = update ? <UpdateBanner releaseUrl={update.url} version={update.version} /> : null;

  useEffect(() => {
    loadTranslations().finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <ErrorBoundary scope={__APP_NAME__} title="Something went wrong">
      <PageShell title={t('app.title')} subtitle="" version={__APP_VERSION__} banner={banner}>
        <p>{'{{NAME}}'}</p>
      </PageShell>
    </ErrorBoundary>
  );
};

export default App;
