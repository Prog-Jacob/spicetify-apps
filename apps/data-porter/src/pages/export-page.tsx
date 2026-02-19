import ErrorCard from './error-card';
import PageShell from './page-shell';
import React, { useState } from 'react';
import useAbortController from '../hooks';
import ProgressCard from './progress-card';
import { DATA_TYPES } from '../data-types';
import DataTypeGrid from './data-type-grid';
import ExportSummary from './export-summary';
import { exportData, downloadJson } from '../services/exporter';
import type { DataType, ExportData, ProgressInfo } from '../types/export';

const { TextComponent, ButtonPrimary, ButtonSecondary, ButtonTertiary } = Spicetify.ReactComponent;

type ExportPageProps = {
  onGoToImport?: () => void;
};
type Status = 'idle' | 'fetching' | 'done' | 'error';

const ExportPage = ({ onGoToImport }: ExportPageProps) => {
  const aborter = useAbortController();
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [result, setResult] = useState<{ data: ExportData; warnings: string[] } | null>(null);
  const [selected, setSelected] = useState<Set<DataType>>(new Set(DATA_TYPES.map((d) => d.type)));

  const startExport = async () => {
    const controller = aborter.start();

    setStatus('fetching');
    setResult(null);
    setProgress({ current: 0, total: 0, label: 'Starting...' });

    try {
      const { data, warnings } = await exportData(selected, setProgress, controller.signal);
      setResult({ data, warnings });
      setStatus(warnings.length > 0 && !data.playlists && !data.library ? 'error' : 'done');
    } catch {
      if (!controller.signal.aborted) setStatus('error');
    } finally {
      setProgress(null);
    }
  };

  const resetExport = () => {
    setStatus('idle');
    setResult(null);
  };

  const allSelected = selected.size === DATA_TYPES.length;
  const isFetching = status === 'fetching';

  return (
    <PageShell
      title="Export Your Data"
      subtitle="Choose what to include, then download as JSON."
      navButton={
        onGoToImport ? (
          <ButtonSecondary onClick={onGoToImport} buttonSize="md">
            Import
          </ButtonSecondary>
        ) : null
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <TextComponent variant="alto" weight="bold">
            What to include
          </TextComponent>
          <ButtonTertiary
            onClick={() =>
              setSelected(allSelected ? new Set() : new Set(DATA_TYPES.map((d) => d.type)))
            }
            buttonSize="sm"
            disabled={isFetching}
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </ButtonTertiary>
        </div>

        <DataTypeGrid selected={selected} onToggle={setSelected} disabled={isFetching} />
      </div>

      {status === 'idle' && (
        <ButtonPrimary onClick={startExport} disabled={selected.size === 0} buttonSize="md">
          {selected.size === 0
            ? 'Select items to export'
            : `Export ${selected.size} of ${DATA_TYPES.length}`}
        </ButtonPrimary>
      )}

      {isFetching && progress && (
        <ProgressCard
          progress={progress}
          onCancel={() => {
            aborter.abort();
            setStatus('idle');
            setProgress(null);
          }}
        />
      )}

      {status === 'done' && result && (
        <ExportSummary
          result={result.data}
          warnings={result.warnings}
          onDownload={() => downloadJson(result.data)}
          onNewExport={resetExport}
        />
      )}

      {status === 'error' && (
        <ErrorCard title="Export Failed" warnings={result?.warnings} onRetry={resetExport} />
      )}
    </PageShell>
  );
};

export default ExportPage;
