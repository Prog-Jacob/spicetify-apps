import { t, loadTranslations } from './i18n';
import ExportPage from './pages/export-page';
import ImportPage from './pages/import-page';
import { useUpdateCheck } from '@shared/hooks';
import { platform } from '@shared/api/platform';
import React, { useState, useEffect } from 'react';
import { UpdateBanner, ErrorBoundary } from '@ui/components';

const App = () => {
  const [ready, setReady] = useState(false);
  const updateUrl = useUpdateCheck('data-porter', __APP_VERSION__);
  const [path, setPath] = useState(() => platform.History.location.pathname as string);
  const banner = updateUrl ? <UpdateBanner appName="data-porter" releaseUrl={updateUrl} /> : null;

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
    <ErrorBoundary scope="data-porter" title={t('error.unexpected')}>
      {path.endsWith('/import') ? (
        <ImportPage banner={banner} />
      ) : (
        <ExportPage
          banner={banner}
          onGoToImport={() => platform.History.push('/data-porter/import')}
        />
      )}
    </ErrorBoundary>
  );
};

export default App;
