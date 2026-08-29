import { t, loadTranslations } from './i18n';
import React, { useState, useEffect } from 'react';
import { useUpdateCheck, useSpicetifyReady } from '@shared/hooks';
import { UpdateBanner, ErrorBoundary, PageShell } from '@ui/components';

const App = () => {
  const spicetifyReady = useSpicetifyReady();
  const [i18nReady, setI18nReady] = useState(false);
  const update = useUpdateCheck();

  useEffect(() => {
    loadTranslations().finally(() => setI18nReady(true));
  }, []);

  if (!spicetifyReady || !i18nReady) return null;

  const banner = update ? <UpdateBanner releaseUrl={update.url} version={update.version} /> : null;

  return (
    <ErrorBoundary scope={__APP_NAME__} title={t('app.error')}>
      <PageShell title={t('app.title')} subtitle="" version={__APP_VERSION__} banner={banner}>
        <p>{'{{NAME}}'}</p>
      </PageShell>
    </ErrorBoundary>
  );
};

export default App;
