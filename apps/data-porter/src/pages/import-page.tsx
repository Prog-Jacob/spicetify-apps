import { t } from '../i18n';
import React, { useState } from 'react';
import ConflictCard from './conflict-card';
import DataTypeGrid from './data-type-grid';
import FileDropZone from './file-drop-zone';
import ImportSummary from './import-summary';
import { platform } from '@shared/api/platform';
import type { DataType } from '../types/export';
import { notifyError } from '@shared/lib/errors';
import { importData } from '../services/importer';
import { getAvailableCounts } from '../data-types';
import { ErrorCard } from '@ui/components/ui/error-card';
import { PageShell } from '@ui/components/ui/page-shell';
import type { ProgressInfo } from '@shared/types/platform';
import { fetchExistingPlaylists } from '@shared/lib/library';
import { ProgressCard } from '@ui/components/ui/progress-card';
import { useAbortController } from '@shared/hooks/use-abort-controller';
import type {
  ParsedFile,
  ImportResult,
  PlaylistConflict,
  PlaylistConflictResolution,
} from '../types/import';

const { TextComponent, ButtonPrimary, ButtonSecondary, ButtonTertiary } = Spicetify.ReactComponent;

type Step = 'upload' | 'preview' | 'conflicts' | 'importing' | 'done' | 'error';

const ImportPage = ({ banner }: { banner?: React.ReactNode }) => {
  const [step, setStep] = useState<Step>('upload');
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

    setStep('importing');
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
        importResult.log.length > 0 && importResult.log.every((e) => e.status === 'error');
      setStep(allFailed ? 'error' : 'done');
    } catch (e) {
      if (controller.signal.aborted) return;
      console.error('[data-porter] Import failed:', e);
      setResult({ log: [], warnings: [e instanceof Error ? e.message : String(e)] });
      setStep('error');
    } finally {
      setProgress(null);
    }
  };

  const detectConflictsAndImport = async () => {
    const playlists = parsed?.data.playlists;
    if (!parsed || !selected.has('playlists') || !playlists?.length) {
      await runImport(new Map(), new Map());
      return;
    }

    setProgress({ current: 0, total: 0, label: t('progress.checkingPlaylists') });
    setStep('importing');

    try {
      const existing = await fetchExistingPlaylists();
      const found = playlists.flatMap(({ name }) => {
        const uri = existing.get(name);
        return uri ? { importedName: name, existingUri: uri } : [];
      });

      if (found.length === 0) {
        await runImport(new Map(), existing);
      } else {
        setConflicts(found);
        setResolutions(new Map(found.map((c) => [c.importedName, 'skip'])));
        setExistingUris(existing);
        setProgress(null);
        setStep('conflicts');
      }
    } catch (e) {
      notifyError(e, t('progress.checkingPlaylists'));
      await runImport(new Map(), new Map());
    }
  };

  const reset = () => {
    setStep('upload');
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
        <ButtonSecondary onClick={() => platform.History.push('/data-porter')} buttonSize="md">
          {t('nav.export')}
        </ButtonSecondary>
      }
    >
      {step === 'upload' && (
        <FileDropZone
          onFileSelected={(file) => {
            setParsed(file);
            setSelected(new Set(getAvailableCounts(file.data).keys()));
            setStep('preview');
          }}
        />
      )}

      {step === 'preview' && parsed && (
        <>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <TextComponent variant="ballad" weight="bold">
                  {t('import.foundIn', { fileName: parsed.fileName })}
                </TextComponent>
                <TextComponent variant="minuet" semanticColor="textSubdued">
                  {parsed.sourceFormat === 'spotify-official'
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

      {step === 'conflicts' && (
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

      {step === 'importing' && progress && (
        <ProgressCard
          progress={progress}
          onCancel={() => {
            aborter.abort();
            setStep('upload');
            setProgress(null);
          }}
        />
      )}

      {step === 'done' && result && (
        <ImportSummary
          result={result}
          onImportAgain={reset}
          onGoToExport={() => platform.History.push('/data-porter')}
        />
      )}

      {step === 'error' && (
        <ErrorCard title={t('import.failed')} warnings={result?.warnings} onRetry={reset} />
      )}
    </PageShell>
  );
};

export default ImportPage;
