import { t } from './i18n';
import { t as ut } from '@ui/i18n';
import ExportPage from './pages/export-page';
import ImportPage from './pages/import-page';
import { platform } from '@shared/api/platform';
import React, { useState, useEffect } from 'react';
import { fetchLocale } from '@shared/i18n/fetch-locale';
import UpdateBanner from '@ui/components/ui/update-banner';
import { useUpdateCheck } from '@shared/hooks/use-update-check';

const App = () => {
  const [ready, setReady] = useState(false);
  const updateUrl = useUpdateCheck('data-porter', __APP_VERSION__);
  const [path, setPath] = useState(() => platform.History.location.pathname as string);
  const banner = updateUrl ? <UpdateBanner appName="data-porter" releaseUrl={updateUrl} /> : null;

  useEffect(() => {
    Promise.all([
      t.load(fetchLocale('apps/data-porter/src/i18n')),
      ut.load(fetchLocale('packages/ui/src/i18n')),
    ]).finally(() => setReady(true));
  }, []);

  useEffect(() => {
    const unlisten = platform.History.listen(({ pathname }: { pathname: string }) => {
      setPath(pathname);
    });

    return typeof unlisten === 'function' ? unlisten : undefined;
  }, []);

  if (!ready) return null;

  if (path.endsWith('/import')) return <ImportPage banner={banner} />;

  return (
    <ExportPage banner={banner} onGoToImport={() => platform.History.push('/data-porter/import')} />
  );
};

export default App;
