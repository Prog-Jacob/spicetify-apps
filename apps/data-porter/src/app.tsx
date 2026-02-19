import ExportPage from './pages/export-page';
import ImportPage from './pages/import-page';
import { platform } from '@shared/api/platform';
import React, { useState, useEffect } from 'react';

const App = () => {
  const [path, setPath] = useState(() => platform.History.location.pathname as string);

  useEffect(() => {
    const unlisten = platform.History.listen(({ pathname }: { pathname: string }) => {
      setPath(pathname);
    });

    return typeof unlisten === 'function' ? unlisten : undefined;
  }, []);

  if (path.endsWith('/import')) return <ImportPage />;

  return <ExportPage onGoToImport={() => platform.History.push('/data-porter/import')} />;
};

export default App;
