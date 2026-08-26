import { ROUTE } from './constants';
import { t, loadTranslations } from './i18n';
import ExportPage from './pages/export-page';
import ImportPage from './pages/import-page';
import React, { useState, useEffect } from 'react';
import { UpdateBanner, ErrorBoundary } from '@ui/components';
import { useUpdateCheck, useSpicetifyReady } from '@shared/hooks';

const App = () => {
  const spicetifyReady = useSpicetifyReady();
  const [i18nReady, setI18nReady] = useState(false);
  const update = useUpdateCheck();
  const [path, setPath] = useState('');

  useEffect(() => {
    loadTranslations().finally(() => setI18nReady(true));
  }, []);

  useEffect(() => {
    if (!spicetifyReady) return;
    setPath(Spicetify.Platform.History.location.pathname);
    return Spicetify.Platform.History.listen(({ pathname }) => {
      setPath(pathname);
    });
  }, [spicetifyReady]);

  if (!spicetifyReady || !i18nReady || !path) return null;

  const isImport = path.endsWith(ROUTE.IMPORT);

  // both pages stay mounted so their state survives switching between them
  return (
    <ErrorBoundary scope={__APP_NAME__} title={t('error.unexpected')}>
      {update && (
        <UpdateBanner
          className="mx-auto -mb-8 w-full max-w-5xl px-6 pt-16"
          releaseUrl={update.url}
          version={update.version}
        />
      )}
      <div hidden={!isImport}>
        <ImportPage />
      </div>
      <div hidden={isImport}>
        <ExportPage
          onGoToImport={() => Spicetify.Platform.History.push(`/${__APP_NAME__}${ROUTE.IMPORT}`)}
        />
      </div>
    </ErrorBoundary>
  );
};

export default App;
