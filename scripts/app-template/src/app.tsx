import { t, loadTranslations } from './i18n';
import { useUpdateCheck } from '@shared/hooks';
import React, { useState, useEffect } from 'react';
import { UpdateBanner, ErrorBoundary, PageShell } from '@ui/components';

const App = () => {
  const [ready, setReady] = useState(false);
  const updateUrl = useUpdateCheck(__APP_NAME__, __APP_VERSION__);
  const banner = updateUrl ? <UpdateBanner appName={__APP_NAME__} releaseUrl={updateUrl} /> : null;

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
