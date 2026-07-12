import { ROUTE } from './constants';
import { t, loadTranslations } from './i18n';
import ExportPage from './pages/export-page';
import ImportPage from './pages/import-page';
import { useUpdateCheck } from '@shared/hooks';
import React, { useState, useEffect } from 'react';
import { UpdateBanner, ErrorBoundary } from '@ui/components';

const App = () => {
  const [ready, setReady] = useState(false);
  const updateUrl = useUpdateCheck(__APP_NAME__, __APP_VERSION__);
  const [path, setPath] = useState(() => Spicetify.Platform.History.location.pathname);
  const banner = updateUrl ? <UpdateBanner appName={__APP_NAME__} releaseUrl={updateUrl} /> : null;

  useEffect(() => {
    loadTranslations().finally(() => setReady(true));
  }, []);

  useEffect(() => {
    return Spicetify.Platform.History.listen(({ pathname }) => {
      setPath(pathname);
    });
  }, []);

  if (!ready) return null;

  const isImport = path.endsWith(ROUTE.IMPORT);

  // both pages stay mounted so their state survives switching between them
  return (
    <ErrorBoundary scope={__APP_NAME__} title={t('error.unexpected')}>
      <div hidden={!isImport}>
        <ImportPage banner={banner} />
      </div>
      <div hidden={isImport}>
        <ExportPage
          banner={banner}
          onGoToImport={() => Spicetify.Platform.History.push(`/${__APP_NAME__}${ROUTE.IMPORT}`)}
        />
      </div>
    </ErrorBoundary>
  );
};

export default App;
