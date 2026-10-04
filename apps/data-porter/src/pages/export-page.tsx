import { t } from '../i18n';
import React, { useState } from 'react';
import { exportData } from '../services/exporter';
import type { ProgressInfo } from '@shared/types';
import { useAbortController } from '@shared/hooks';
import { EXPORT_FILENAME_PREFIX } from '../constants';
import FriendPicker from '../components/friend-picker';
import DataTypeGrid from '../components/data-type-grid';
import ExportSummary from '../components/export-summary';
import { ALL_DATA_TYPES as DATA_TYPES } from '../data-types';
import type { DataType, ExportResult } from '../types/export';
import { exportPublicProfile } from '../services/profile-export';
import { downloadJson, errorMessage, notifyDone, notifyError, ValidationError } from '@shared/lib';
import {
  Input,
  ErrorCard,
  PageShell,
  ProgressCard,
  SpicetifyIcon,
  SegmentedTabs,
  TextComponent,
  ButtonPrimary,
  ButtonTertiary,
  ButtonSecondary,
} from '@ui/components';

const MODE = { MY_DATA: 'my-data', OTHER_USER: 'other-user' } as const;

type Mode = (typeof MODE)[keyof typeof MODE];

type Run =
  | { status: 'idle' }
  | { status: 'fetching'; progress: ProgressInfo }
  | { status: 'done'; result: ExportResult }
  | { status: 'error'; warnings: string[] };

const IDLE: Run = { status: 'idle' };

const panelId = (mode: Mode) => `${__APP_NAME__}-export-${mode}`;

type ExportPageProps = {
  onGoToImport?: () => void;
};

const ExportPage = ({ onGoToImport }: ExportPageProps) => {
  const aborter = useAbortController();
  const [userInput, setUserInput] = useState('');
  const [mode, setMode] = useState<Mode>(MODE.MY_DATA);
  const [run, setRun] = useState<Run>(IDLE);
  const [selected, setSelected] = useState<Set<DataType>>(new Set(DATA_TYPES.map((d) => d.type)));

  const startExport = async () => {
    const { signal } = aborter.start();
    const onProgress = (progress: ProgressInfo) => {
      if (!signal.aborted) setRun({ status: 'fetching', progress });
    };
    onProgress({ current: 0, total: 0, label: t('progress.starting') });

    try {
      const result =
        mode === MODE.OTHER_USER
          ? await exportPublicProfile(userInput, onProgress, signal)
          : await exportData(selected, onProgress, signal);
      if (signal.aborted) return;
      const isEmpty = Object.keys(result.data).length === 0;
      setRun(
        result.warnings.length > 0 && isEmpty
          ? { status: 'error', warnings: result.warnings }
          : { status: 'done', result },
      );
    } catch (e) {
      if (signal.aborted) return;
      if (e instanceof ValidationError) {
        notifyError(e);
        setRun(IDLE);
      } else {
        setRun({ status: 'error', warnings: [errorMessage(e)] });
      }
    }
  };

  const resetExport = () => setRun(IDLE);

  const switchMode = (newMode: Mode) => {
    if (newMode === mode) return;
    aborter.abort();
    resetExport();
    setMode(newMode);
  };

  const isFetching = run.status === 'fetching';
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
      <SegmentedTabs
        variant="pill"
        label={t('export.mode')}
        active={mode}
        onChange={switchMode}
        disabled={isFetching}
        panelId={panelId}
        segments={[
          { id: MODE.MY_DATA, label: t('export.myData'), icon: 'library' },
          { id: MODE.OTHER_USER, label: t('export.anotherUser'), icon: 'artist' },
        ]}
      />

      <div
        role="tabpanel"
        id={panelId(MODE.MY_DATA)}
        aria-labelledby={`${panelId(MODE.MY_DATA)}-tab`}
        hidden={mode !== MODE.MY_DATA}
      >
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
              onChange={setSelected}
              disabled={isFetching}
              dataTypes={DATA_TYPES}
            />
          </div>

          {run.status === 'idle' && (
            <ButtonPrimary onClick={startExport} disabled={selected.size === 0} buttonSize="md">
              {selected.size === 0
                ? t('export.selectItems')
                : t('export.count', { selected: selected.size, total: DATA_TYPES.length })}
            </ButtonPrimary>
          )}
        </div>
      </div>

      <div
        role="tabpanel"
        id={panelId(MODE.OTHER_USER)}
        aria-labelledby={`${panelId(MODE.OTHER_USER)}-tab`}
        hidden={mode !== MODE.OTHER_USER}
      >
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
              aria-label={t('export.spotifyProfile')}
              disabled={isFetching}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isFetching && userInput.trim()) void startExport();
              }}
            />
            <FriendPicker value={userInput} disabled={isFetching} onPick={setUserInput} />
          </div>

          {run.status === 'idle' && (
            <ButtonPrimary onClick={startExport} disabled={!userInput.trim()} buttonSize="md">
              {t('export.exportUserData')}
            </ButtonPrimary>
          )}
        </div>
      </div>

      {run.status === 'fetching' && (
        <ProgressCard
          progress={run.progress}
          onCancel={() => {
            aborter.abort();
            resetExport();
          }}
        />
      )}

      {run.status === 'done' && (
        <ExportSummary
          result={run.result.data}
          warnings={run.result.warnings}
          onDownload={() => {
            const fileName = `${EXPORT_FILENAME_PREFIX}-${run.result.userName ?? 'unknown'}-${new Date().toISOString().slice(0, 10)}.json`;
            downloadJson(run.result.data, fileName);
            notifyDone(
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SpicetifyIcon icon="check-alt-fill" size={14} />
                {t('export.downloaded')}
              </span>,
            );
          }}
          onNewExport={resetExport}
        />
      )}

      {run.status === 'error' && (
        <ErrorCard title={t('export.failed')} warnings={run.warnings} onRetry={resetExport} />
      )}
    </PageShell>
  );
};

export default ExportPage;
