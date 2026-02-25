import { t, loadTranslations } from './i18n';
import ExportPage from './pages/export-page';
import ImportPage from './pages/import-page';
import { useUpdateCheck } from '@shared/hooks';
import { platform } from '@shared/api/platform';
import React, { useState, useEffect } from 'react';
import { UpdateBanner, ErrorBoundary } from '@ui/components';

const App = () => {
  const [ready, setReady] = useState(false);
  const updateUrl = useUpdateCheck(__APP_NAME__, __APP_VERSION__);
  const [path, setPath] = useState(() => platform.History.location.pathname as string);
  const banner = updateUrl ? <UpdateBanner appName={__APP_NAME__} releaseUrl={updateUrl} /> : null;

  useEffect(() => {
    loadTranslations().finally(() => setReady(true));
  }, []);

  useEffect(() => {
    const unlisten = platform.History.listen(({ pathname }: { pathname: string }) => {
      setPath(pathname);
    });

    return typeof unlisten === 'function' ? unlisten : undefined;
  }, []);

  if (!ready) return null;

  return (
    <ErrorBoundary scope={__APP_NAME__} title={t('error.unexpected')}>
      {path.endsWith('/import') ? (
        <ImportPage banner={banner} />
      ) : (
        <ExportPage
          banner={banner}
          onGoToImport={() => platform.History.push(`/${__APP_NAME__}/import`)}
        />
      )}
    </ErrorBoundary>
  );
};

export default App;
