import React from 'react';
import { t, loadTranslations } from './i18n';
import ExportPage from './pages/export-page';
import ImportPage from './pages/import-page';
import { UpdateBanner, ErrorBoundary } from '@ui/components';
import { useAppReady, useLocationPath } from '@shared/hooks';

const ROUTE = { IMPORT: '/import' } as const;

const Pages = () => {
  const isImport = useLocationPath().endsWith(ROUTE.IMPORT);

  // both pages stay mounted so their state survives switching between them
  return (
    <>
      <div hidden={!isImport}>
        <ImportPage />
      </div>
      <div hidden={isImport}>
        <ExportPage
          onGoToImport={() => Spicetify.Platform.History.push(`/${__APP_NAME__}${ROUTE.IMPORT}`)}
        />
      </div>
    </>
  );
};

const App = () => {
  if (!useAppReady(loadTranslations)) return null;

  return (
    <ErrorBoundary title={t('error.unexpected')}>
      <UpdateBanner className="mx-auto -mb-8 w-full max-w-5xl px-6 pt-16" />
      <Pages />
    </ErrorBoundary>
  );
};

export default App;
