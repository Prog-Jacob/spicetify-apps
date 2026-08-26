import React, { useState } from 'react';
import { t, type MessageKey } from '../i18n';
import { exportData } from '../services/exporter';
import type { ProgressInfo } from '@shared/types';
import { useAbortController } from '@shared/hooks';
import DataTypeGrid from '../components/data-type-grid';
import ExportSummary from '../components/export-summary';
import { ALL_DATA_TYPES as DATA_TYPES } from '../data-types';
import type { DataType, ExportResult } from '../types/export';
import { exportPublicProfile } from '../services/profile-export';
import { EXPORT_FILENAME_PREFIX, EXPORT_STATUS } from '../constants';
import { cn, downloadJson, notifyError, ValidationError } from '@shared/lib';
import {
  Input,
  ErrorCard,
  PageShell,
  ProgressCard,
  SpicetifyIcon,
  TextComponent,
  ButtonPrimary,
  ButtonTertiary,
  ButtonSecondary,
} from '@ui/components';

const MODE = { MY_DATA: 'my-data', OTHER_USER: 'other-user' } as const;

type Status = (typeof EXPORT_STATUS)[keyof typeof EXPORT_STATUS];
type Mode = (typeof MODE)[keyof typeof MODE];

const MODES: readonly { value: Mode; labelKey: MessageKey; icon: Spicetify.Icon }[] = [
  { value: MODE.MY_DATA, labelKey: 'export.myData', icon: 'library' },
  { value: MODE.OTHER_USER, labelKey: 'export.anotherUser', icon: 'artist' },
];

type ExportPageProps = {
  onGoToImport?: () => void;
};

const ExportPage = ({ onGoToImport }: ExportPageProps) => {
  const aborter = useAbortController();
  const [userInput, setUserInput] = useState('');
  const [mode, setMode] = useState<Mode>(MODE.MY_DATA);
  const [status, setStatus] = useState<Status>(EXPORT_STATUS.IDLE);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [selected, setSelected] = useState<Set<DataType>>(new Set(DATA_TYPES.map((d) => d.type)));

  const startExport = async () => {
    const controller = aborter.start();

    setStatus(EXPORT_STATUS.FETCHING);
    setResult(null);
    setProgress({ current: 0, total: 0, label: t('progress.starting') });

    try {
      const exportResult =
        mode === MODE.OTHER_USER
          ? await exportPublicProfile(userInput, setProgress, controller.signal)
          : await exportData(selected, setProgress, controller.signal);

      setResult(exportResult);
      const isEmpty = Object.keys(exportResult.data).length === 0;
      setStatus(
        exportResult.warnings.length > 0 && isEmpty ? EXPORT_STATUS.ERROR : EXPORT_STATUS.DONE,
      );
    } catch (e) {
      if (controller.signal.aborted) return;
      if (e instanceof ValidationError) {
        notifyError(e);
        setStatus(EXPORT_STATUS.IDLE);
      } else {
        setResult({ data: {}, warnings: [e instanceof Error ? e.message : String(e)] });
        setStatus(EXPORT_STATUS.ERROR);
      }
    } finally {
      setProgress(null);
    }
  };

  const resetExport = () => {
    setStatus(EXPORT_STATUS.IDLE);
    setResult(null);
  };

  const switchMode = (newMode: Mode) => {
    if (newMode === mode) return;
    aborter.abort();
    resetExport();
    setMode(newMode);
    setProgress(null);
  };

  const isFetching = status === EXPORT_STATUS.FETCHING;
  const allSelected = selected.size === DATA_TYPES.length;

  return (
    <PageShell
      title={t('export.title')}
      subtitle={t('export.subtitle')}
      version={__APP_VERSION__}
      navButton={
        onGoToImport ? (
          <ButtonSecondary onClick={onGoToImport} buttonSize="md">
            {t('nav.import')}
          </ButtonSecondary>
        ) : null
      }
    >
      <div
        role="group"
        aria-label={t('export.mode')}
        className="flex w-fit gap-1 rounded-full bg-spice-highlight/60 p-1"
      >
        {MODES.map(({ value, labelKey, icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => switchMode(value)}
            disabled={isFetching}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 rounded-full border-0 px-4 py-1.5 text-sm font-medium transition-colors disabled:cursor-default disabled:opacity-60',
              mode === value
                ? 'bg-spice-text text-spice-main'
                : 'bg-transparent text-spice-subtext hover:bg-spice-highlight hover:text-spice-text',
            )}
          >
            <SpicetifyIcon icon={icon} size={14} />
            {t(labelKey)}
          </button>
        ))}
      </div>

      <div hidden={mode !== MODE.MY_DATA}>
        <div className="flex flex-col gap-8">
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

            <DataTypeGrid
              selected={selected}
              onToggle={setSelected}
              disabled={isFetching}
              dataTypes={DATA_TYPES}
            />
          </div>

          {status === EXPORT_STATUS.IDLE && (
            <ButtonPrimary onClick={startExport} disabled={selected.size === 0} buttonSize="md">
              {selected.size === 0
                ? t('export.selectItems')
                : t('export.count', { selected: selected.size, total: DATA_TYPES.length })}
            </ButtonPrimary>
          )}
        </div>
      </div>

      <div hidden={mode !== MODE.OTHER_USER}>
        <div className="flex flex-col gap-8">
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

          {status === EXPORT_STATUS.IDLE && (
            <ButtonPrimary onClick={startExport} disabled={!userInput.trim()} buttonSize="md">
              {t('export.exportUserData')}
            </ButtonPrimary>
          )}
        </div>
      </div>

      {isFetching && progress && (
        <ProgressCard
          progress={progress}
          onCancel={() => {
            aborter.abort();
            setStatus(EXPORT_STATUS.IDLE);
          }}
        />
      )}

      {status === EXPORT_STATUS.DONE && result && (
        <ExportSummary
          result={result.data}
          warnings={result.warnings}
          onDownload={() => {
            const fileName = `${EXPORT_FILENAME_PREFIX}-${result.userName ?? 'unknown'}-${new Date().toISOString().slice(0, 10)}.json`;
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

      {status === EXPORT_STATUS.ERROR && (
        <ErrorCard title={t('export.failed')} warnings={result?.warnings} onRetry={resetExport} />
      )}
    </PageShell>
  );
};

export default ExportPage;
