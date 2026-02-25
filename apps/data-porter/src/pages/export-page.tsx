import { cn } from '@shared/lib/utils';
import React, { useState } from 'react';
import { DATA_TYPES } from '../data-types';
import { t, type MessageKey } from '../i18n';
import { exportData } from '../services/exporter';
import { useAbortController } from '@shared/hooks';
import { downloadJson } from '@shared/lib/download';
import { ValidationError } from '@shared/lib/errors';
import DataTypeGrid from '../components/data-type-grid';
import ExportSummary from '../components/export-summary';
import type { ProgressInfo } from '@shared/types/platform';
import type { DataType, ExportResult } from '../types/export';
import { exportPublicProfile } from '../services/profile-export';
import { Input, SpicetifyIcon, ErrorCard, PageShell, ProgressCard } from '@ui/components';

const { TextComponent, ButtonPrimary, ButtonSecondary, ButtonTertiary } = Spicetify.ReactComponent;

type Status = 'idle' | 'fetching' | 'done' | 'error';
type Mode = 'my-data' | 'other-user';

const MODES: readonly { value: Mode; labelKey: MessageKey }[] = [
  { value: 'my-data', labelKey: 'export.myData' },
  { value: 'other-user', labelKey: 'export.anotherUser' },
];

const resolveStatus = (data: ExportResult['data'], warnings: string[]): Status =>
  warnings.length > 0 && !data.playlists && !data.library ? 'error' : 'done';

type ExportPageProps = {
  banner?: React.ReactNode;
  onGoToImport?: () => void;
};

const ExportPage = ({ banner, onGoToImport }: ExportPageProps) => {
  const aborter = useAbortController();
  const [userInput, setUserInput] = useState('');
  const [mode, setMode] = useState<Mode>('my-data');
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<ExportResult | null>(null);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [selected, setSelected] = useState<Set<DataType>>(new Set(DATA_TYPES.map((d) => d.type)));

  const startExport = async () => {
    const controller = aborter.start();

    setStatus('fetching');
    setResult(null);
    setProgress({ current: 0, total: 0, label: t('progress.starting') });

    try {
      const exportResult =
        mode === 'other-user'
          ? await exportPublicProfile(userInput, setProgress, controller.signal)
          : await exportData(selected, setProgress, controller.signal);

      setResult(exportResult);
      setStatus(resolveStatus(exportResult.data, exportResult.warnings));
    } catch (e) {
      if (controller.signal.aborted) return;
      if (e instanceof ValidationError) {
        Spicetify.showNotification(e.message, true);
        setStatus('idle');
      } else {
        setResult({ data: {}, warnings: [e instanceof Error ? e.message : String(e)] });
        setStatus('error');
      }
    } finally {
      setProgress(null);
    }
  };

  const resetExport = () => {
    setStatus('idle');
    setResult(null);
  };

  const switchMode = (newMode: Mode) => {
    if (newMode === mode) return;
    aborter.abort();
    resetExport();
    setMode(newMode);
    setProgress(null);
  };

  const isFetching = status === 'fetching';
  const allSelected = selected.size === DATA_TYPES.length;

  return (
    <PageShell
      title={t('export.title')}
      subtitle={t('export.subtitle')}
      version={__APP_VERSION__}
      banner={banner}
      navButton={
        onGoToImport ? (
          <ButtonSecondary onClick={onGoToImport} buttonSize="md">
            {t('nav.import')}
          </ButtonSecondary>
        ) : null
      }
    >
      <div className="flex gap-1">
        {MODES.map(({ value, labelKey }) => (
          <ButtonTertiary
            key={value}
            onClick={() => switchMode(value)}
            buttonSize="sm"
            disabled={isFetching}
            className={cn(
              mode === value
                ? 'border-spice-button text-spice-text'
                : 'text-spice-subtext hover:text-spice-text',
            )}
          >
            {t(labelKey)}
          </ButtonTertiary>
        ))}
      </div>

      {mode === 'my-data' && (
        <>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <TextComponent variant="alto" weight="bold">
                {t('export.whatToInclude')}
              </TextComponent>
              <ButtonTertiary
                onClick={() =>
                  setSelected(allSelected ? new Set() : new Set(DATA_TYPES.map((d) => d.type)))
                }
                buttonSize="sm"
                disabled={isFetching}
              >
                {allSelected ? t('deselectAll') : t('selectAll')}
              </ButtonTertiary>
            </div>

            <DataTypeGrid selected={selected} onToggle={setSelected} disabled={isFetching} />
          </div>

          {status === 'idle' && (
            <ButtonPrimary onClick={startExport} disabled={selected.size === 0} buttonSize="md">
              {selected.size === 0
                ? t('export.selectItems')
                : t('export.count', { selected: selected.size, total: DATA_TYPES.length })}
            </ButtonPrimary>
          )}
        </>
      )}

      {mode === 'other-user' && (
        <>
          <div className="flex flex-col gap-3">
            <TextComponent variant="alto" weight="bold">
              {t('export.spotifyProfile')}
            </TextComponent>
            <Input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={t('export.profilePlaceholder')}
              disabled={isFetching}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isFetching && userInput.trim()) startExport();
              }}
            />
          </div>

          {status === 'idle' && (
            <ButtonPrimary onClick={startExport} disabled={!userInput.trim()} buttonSize="md">
              {t('export.exportUserData')}
            </ButtonPrimary>
          )}
        </>
      )}

      {isFetching && progress && (
        <ProgressCard
          progress={progress}
          onCancel={() => {
            aborter.abort();
            setStatus('idle');
          }}
        />
      )}

      {status === 'done' && result && (
        <ExportSummary
          result={result.data}
          warnings={result.warnings}
          onDownload={() => {
            const fileName = `spotify-export-${result.userName ?? 'unknown'}-${new Date().toISOString().slice(0, 10)}.json`;
            downloadJson(result.data, fileName);
            Spicetify.showNotification(
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SpicetifyIcon icon="check-alt-fill" size={14} />
                {t('export.downloaded')}
              </span>,
            );
          }}
          onNewExport={resetExport}
        />
      )}

      {status === 'error' && (
        <ErrorCard title={t('export.failed')} warnings={result?.warnings} onRetry={resetExport} />
      )}
    </PageShell>
  );
};

export default ExportPage;
