import { t } from '../i18n';
import { platform } from '@shared/api';
import React, { useState } from 'react';
import { notifyError } from '@shared/lib';
import type { DataType } from '../types/export';
import { importData } from '../services/importer';
import type { ProgressInfo } from '@shared/types';
import { getAvailableCounts } from '../data-types';
import { useAbortController } from '@shared/hooks';
import ConflictCard from '../components/conflict-card';
import DataTypeGrid from '../components/data-type-grid';
import FileDropZone from '../components/file-drop-zone';
import ImportSummary from '../components/import-summary';
import { ErrorCard, PageShell, ProgressCard } from '@ui/components';
import { fetchExistingPlaylists } from '../services/playlist-lookup';
import { DATA_TYPE, SOURCE_FORMAT, CONFLICT_RESOLUTION, LOG_STATUS } from '../constants';
import type {
  ParsedFile,
  ImportResult,
  PlaylistConflict,
  PlaylistConflictResolution,
} from '../types/import';

const { TextComponent, ButtonPrimary, ButtonSecondary, ButtonTertiary } = Spicetify.ReactComponent;
const STEP = {
  DONE: 'done',
  ERROR: 'error',
  UPLOAD: 'upload',
  PREVIEW: 'preview',
  CONFLICTS: 'conflicts',
  IMPORTING: 'importing',
} as const;

type Step = (typeof STEP)[keyof typeof STEP];

const ImportPage = ({ banner }: { banner?: React.ReactNode }) => {
  const [step, setStep] = useState<Step>(STEP.UPLOAD);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [selected, setSelected] = useState<Set<DataType>>(new Set());
  const [conflicts, setConflicts] = useState<PlaylistConflict[]>([]);
  const [resolutions, setResolutions] = useState<Map<string, PlaylistConflictResolution>>(
    new Map(),
  );
  const [existingUris, setExistingUris] = useState<Map<string, string>>(new Map());
  const aborter = useAbortController();
  const [result, setResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);

  const runImport = async (
    resolvedConflicts: Map<string, PlaylistConflictResolution>,
    existingMap: Map<string, string>,
  ) => {
    if (!parsed) return;

    const controller = aborter.start();

    setStep(STEP.IMPORTING);
    setResult(null);
    setProgress({ current: 0, total: 0, label: t('progress.starting') });

    try {
      const importResult = await importData(
        parsed.data,
        selected,
        resolvedConflicts,
        existingMap,
        setProgress,
        controller.signal,
      );
      setResult(importResult);
      const allFailed =
        importResult.log.length > 0 && importResult.log.every((e) => e.status === LOG_STATUS.ERROR);
      setStep(allFailed ? STEP.ERROR : STEP.DONE);
    } catch (e) {
      if (controller.signal.aborted) return;
      console.error(`[${__APP_NAME__}] Import failed:`, e);
      setResult({ log: [], warnings: [e instanceof Error ? e.message : String(e)] });
      setStep(STEP.ERROR);
    } finally {
      setProgress(null);
    }
  };

  const detectConflictsAndImport = async () => {
    const controller = aborter.start();
    const playlists = parsed?.data.playlists;

    if (!parsed || !selected.has(DATA_TYPE.PLAYLISTS) || !playlists?.length) {
      await runImport(new Map(), new Map());
      return;
    }

    setProgress({ current: 0, total: 0, label: t('progress.checkingPlaylists') });
    setStep(STEP.IMPORTING);

    try {
      const existing = await fetchExistingPlaylists(controller.signal);
      const found = playlists.flatMap(({ name }) => {
        const uri = existing.get(name);
        return uri ? { importedName: name, existingUri: uri } : [];
      });

      if (found.length === 0) {
        await runImport(new Map(), existing);
      } else {
        setConflicts(found);
        setResolutions(new Map(found.map((c) => [c.importedName, CONFLICT_RESOLUTION.SKIP])));
        setExistingUris(existing);
        setProgress(null);
        setStep(STEP.CONFLICTS);
      }
    } catch (e) {
      if (controller.signal.aborted) return;
      notifyError(e, t('progress.checkingPlaylists'));
      setProgress(null);
      setStep(STEP.PREVIEW);
    }
  };

  const reset = () => {
    setStep(STEP.UPLOAD);
    setParsed(null);
    setSelected(new Set());
    setConflicts([]);
    setResolutions(new Map());
    setResult(null);
  };

  const counts = parsed ? getAvailableCounts(parsed.data) : new Map();

  return (
    <PageShell
      title={t('import.title')}
      subtitle={t('import.subtitle')}
      version={__APP_VERSION__}
      banner={banner}
      navButton={
        <ButtonSecondary onClick={() => platform.History.push(`/${__APP_NAME__}`)} buttonSize="md">
          {t('nav.export')}
        </ButtonSecondary>
      }
    >
      {step === STEP.UPLOAD && (
        <FileDropZone
          onFileSelected={(file) => {
            setParsed(file);
            setSelected(new Set(getAvailableCounts(file.data).keys()));
            setStep(STEP.PREVIEW);
          }}
        />
      )}

      {step === STEP.PREVIEW && parsed && (
        <>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <TextComponent variant="ballad" weight="bold">
                  {t('import.foundIn', { fileName: parsed.fileName })}
                </TextComponent>
                <TextComponent variant="minuet" semanticColor="textSubdued">
                  {parsed.sourceFormat === SOURCE_FORMAT.SPOTIFY_OFFICIAL
                    ? t('import.sourceSpotify')
                    : t('import.sourceDataPorter')}
                </TextComponent>
              </div>
              <ButtonTertiary onClick={reset} buttonSize="sm">
                {t('import.chooseDifferent')}
              </ButtonTertiary>
            </div>

            <DataTypeGrid selected={selected} onToggle={setSelected} counts={counts} />
          </div>

          <ButtonPrimary
            onClick={detectConflictsAndImport}
            disabled={selected.size === 0}
            buttonSize="md"
          >
            {t('import.importSelected')}
          </ButtonPrimary>
        </>
      )}

      {step === STEP.CONFLICTS && (
        <ConflictCard
          conflicts={conflicts}
          resolutions={resolutions}
          onResolutionChange={(name, value) =>
            setResolutions((prev) => new Map(prev).set(name, value))
          }
          onApplyAll={(value, names) =>
            setResolutions(
              (prev) => new Map([...prev, ...names.map((name) => [name, value] as const)]),
            )
          }
          onContinue={() => runImport(resolutions, existingUris)}
          onCancel={reset}
        />
      )}

      {step === STEP.IMPORTING && progress && (
        <ProgressCard
          progress={progress}
          onCancel={() => {
            aborter.abort();
            setStep(STEP.UPLOAD);
            setProgress(null);
          }}
        />
      )}

      {step === STEP.DONE && result && (
        <ImportSummary
          result={result}
          onImportAgain={reset}
          onGoToExport={() => platform.History.push(`/${__APP_NAME__}`)}
        />
      )}

      {step === STEP.ERROR && (
        <ErrorCard title={t('import.failed')} warnings={result?.warnings} onRetry={reset} />
      )}
    </PageShell>
  );
};

export default ImportPage;
