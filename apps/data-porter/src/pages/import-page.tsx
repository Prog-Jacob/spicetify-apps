import React, { useState } from 'react';
import { t, type MessageKey } from '../i18n';
import type { DataType } from '../types/export';
import { importData } from '../services/importer';
import type { ProgressInfo } from '@shared/types';
import { getAvailableCounts } from '../data-types';
import { useAbortController } from '@shared/hooks';
import DataTypeGrid from '../components/data-type-grid';
import FileDropZone from '../components/file-drop-zone';
import ImportSummary from '../components/import-summary';
import ContentPreview from '../components/content-preview';
import { notifyError, ValidationError } from '@shared/lib';
import { exportPublicProfile } from '../services/profile-export';
import PlaylistReviewCard from '../components/playlist-review-card';
import { fetchExistingPlaylists } from '../services/playlist-lookup';
import {
  ErrorCard,
  PageShell,
  ProgressCard,
  TextComponent,
  ButtonPrimary,
  ButtonTertiary,
  ButtonSecondary,
} from '@ui/components';
import {
  DATA_TYPE,
  LOG_STATUS,
  IMPORT_STEP,
  SOURCE_FORMAT,
  CONFLICT_RESOLUTION,
} from '../constants';
import type {
  ParsedFile,
  SourceFormat,
  ImportResult,
  PlaylistReviewItem,
  PlaylistConflictResolution,
} from '../types/import';

type Step = (typeof IMPORT_STEP)[keyof typeof IMPORT_STEP];

const SOURCE_LABEL: Record<SourceFormat, MessageKey> = {
  [SOURCE_FORMAT.SPOTIFY_OFFICIAL]: 'import.sourceSpotify',
  [SOURCE_FORMAT.OUR_EXPORT]: 'import.sourceDataPorter',
  [SOURCE_FORMAT.PROFILE]: 'import.sourceProfile',
};

const ImportPage = () => {
  const [step, setStep] = useState<Step>(IMPORT_STEP.UPLOAD);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [selected, setSelected] = useState<Set<DataType>>(new Set());
  const [reviewItems, setReviewItems] = useState<PlaylistReviewItem[]>([]);
  const [resolutions, setResolutions] = useState<Map<number, PlaylistConflictResolution>>(
    new Map(),
  );
  const [existingUris, setExistingUris] = useState<Map<string, string>>(new Map());
  const [previewing, setPreviewing] = useState<DataType | null>(null);
  const aborter = useAbortController();
  const [result, setResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);

  const runImport = async (
    resolvedConflicts: Map<number, PlaylistConflictResolution>,
    existingMap: Map<string, string>,
  ) => {
    if (!parsed) return;

    const controller = aborter.start();

    setStep(IMPORT_STEP.IMPORTING);
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
      setStep(allFailed ? IMPORT_STEP.ERROR : IMPORT_STEP.DONE);
    } catch (e) {
      if (controller.signal.aborted) return;
      console.error(`[${__APP_NAME__}] Import failed:`, e);
      setResult({ log: [], warnings: [e instanceof Error ? e.message : String(e)] });
      setStep(IMPORT_STEP.ERROR);
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
    setStep(IMPORT_STEP.IMPORTING);

    try {
      const existing = await fetchExistingPlaylists(controller.signal);

      const items: PlaylistReviewItem[] = playlists.map(({ name, items: playlistItems }, i) => ({
        index: i,
        name,
        trackCount: playlistItems.length,
        existingUri: existing.get(name),
      }));

      setReviewItems(items);
      setResolutions(
        new Map(
          items.map((item) => [
            item.index,
            item.existingUri ? CONFLICT_RESOLUTION.SKIP : CONFLICT_RESOLUTION.CREATE_NEW,
          ]),
        ),
      );
      setExistingUris(existing);
      setProgress(null);
      setStep(IMPORT_STEP.PLAYLISTS);
    } catch (e) {
      if (controller.signal.aborted) return;
      notifyError(e, t('progress.checkingPlaylists'));
      setProgress(null);
      setStep(IMPORT_STEP.PREVIEW);
    }
  };

  const importFromProfile = async (input: string) => {
    const controller = aborter.start();

    setStep(IMPORT_STEP.IMPORTING);
    setResult(null);
    setProgress({ current: 0, total: 0, label: t('progress.starting') });

    try {
      const { data, userName } = await exportPublicProfile(input, setProgress, controller.signal);
      setParsed({ data, sourceFormat: SOURCE_FORMAT.PROFILE, fileName: userName ?? input });
      setSelected(new Set(getAvailableCounts(data).keys()));
      setStep(IMPORT_STEP.PREVIEW);
    } catch (e) {
      if (controller.signal.aborted) return;
      if (e instanceof ValidationError) {
        notifyError(e);
        setStep(IMPORT_STEP.UPLOAD);
      } else {
        setResult({ log: [], warnings: [e instanceof Error ? e.message : String(e)] });
        setStep(IMPORT_STEP.ERROR);
      }
    } finally {
      setProgress(null);
    }
  };

  const reset = () => {
    setStep(IMPORT_STEP.UPLOAD);
    setParsed(null);
    setSelected(new Set());
    setReviewItems([]);
    setResolutions(new Map());
    setResult(null);
  };

  const counts = parsed ? getAvailableCounts(parsed.data) : new Map();

  return (
    <PageShell
      title={t('import.title')}
      subtitle={t('import.subtitle')}
      version={__APP_VERSION__}
      navButton={
        <ButtonSecondary
          onClick={() => Spicetify.Platform.History.push(`/${__APP_NAME__}`)}
          buttonSize="md"
        >
          {t('nav.export')}
        </ButtonSecondary>
      }
    >
      {step === IMPORT_STEP.UPLOAD && (
        <FileDropZone
          onProfileImport={importFromProfile}
          onFileSelected={(file) => {
            setParsed(file);
            setSelected(new Set(getAvailableCounts(file.data).keys()));
            setStep(IMPORT_STEP.PREVIEW);
          }}
        />
      )}

      {step === IMPORT_STEP.PREVIEW && parsed && (
        <>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <TextComponent variant="ballad" weight="bold">
                  {t('import.foundIn', { fileName: parsed.fileName })}
                </TextComponent>
                <TextComponent variant="minuet" semanticColor="textSubdued">
                  {t(SOURCE_LABEL[parsed.sourceFormat])}
                </TextComponent>
              </div>
              <ButtonTertiary onClick={reset} buttonSize="sm">
                {t('import.chooseDifferent')}
              </ButtonTertiary>
            </div>

            <DataTypeGrid
              selected={selected}
              onToggle={setSelected}
              counts={counts}
              onPreview={setPreviewing}
            />
          </div>

          <ButtonPrimary
            onClick={detectConflictsAndImport}
            disabled={selected.size === 0}
            buttonSize="md"
          >
            {t('import.importSelected')}
          </ButtonPrimary>

          {previewing && (
            <ContentPreview
              type={previewing}
              data={parsed.data}
              onClose={() => setPreviewing(null)}
            />
          )}
        </>
      )}

      {step === IMPORT_STEP.PLAYLISTS && (
        <PlaylistReviewCard
          items={reviewItems}
          resolutions={resolutions}
          onResolutionChange={(index, value) =>
            setResolutions((prev) => new Map(prev).set(index, value))
          }
          onApplyAll={(value, indices) =>
            setResolutions(
              (prev) => new Map([...prev, ...indices.map((idx) => [idx, value] as const)]),
            )
          }
          onContinue={() => runImport(resolutions, existingUris)}
          onCancel={() => setStep(IMPORT_STEP.PREVIEW)}
        />
      )}

      {step === IMPORT_STEP.IMPORTING && progress && (
        <ProgressCard
          progress={progress}
          onCancel={() => {
            aborter.abort();
            setStep(parsed ? IMPORT_STEP.PREVIEW : IMPORT_STEP.UPLOAD);
            setProgress(null);
          }}
        />
      )}

      {step === IMPORT_STEP.DONE && result && (
        <ImportSummary
          result={result}
          onImportAgain={reset}
          onGoToExport={() => Spicetify.Platform.History.push(`/${__APP_NAME__}`)}
        />
      )}

      {step === IMPORT_STEP.ERROR && (
        <ErrorCard title={t('import.failed')} warnings={result?.warnings} onRetry={reset} />
      )}
    </PageShell>
  );
};

export default ImportPage;
