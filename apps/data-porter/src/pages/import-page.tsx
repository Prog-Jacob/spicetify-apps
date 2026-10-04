import React, { useReducer } from 'react';
import { t, type MessageKey } from '../i18n';
import type { DataType } from '../types/export';
import { importData } from '../services/importer';
import type { ProgressInfo } from '@shared/types';
import { getAvailableCounts } from '../data-types';
import { useAbortController } from '@shared/hooks';
import { fetchRootlistPlaylists } from '@shared/api';
import DataTypeGrid from '../components/data-type-grid';
import FileDropZone from '../components/file-drop-zone';
import ImportSummary from '../components/import-summary';
import ContentPreview from '../components/content-preview';
import { exportPublicProfile } from '../services/profile-export';
import PlaylistReviewCard from '../components/playlist-review-card';
import { errorMessage, notifyError, ValidationError } from '@shared/lib';
import { DATA_TYPE, LOG_STATUS, SOURCE_FORMAT, CONFLICT_RESOLUTION } from '../constants';
import {
  ErrorCard,
  PageShell,
  ProgressCard,
  TextComponent,
  ButtonPrimary,
  ButtonTertiary,
  ButtonSecondary,
} from '@ui/components';
import type {
  ParsedFile,
  SourceFormat,
  ImportResult,
  PlaylistReviewItem,
  PlaylistConflictResolution,
} from '../types/import';

const SOURCE_LABEL: Record<SourceFormat, MessageKey> = {
  [SOURCE_FORMAT.SPOTIFY_OFFICIAL]: 'import.sourceSpotify',
  [SOURCE_FORMAT.OUR_EXPORT]: 'import.sourceDataPorter',
  [SOURCE_FORMAT.PROFILE]: 'import.sourceProfile',
};

type Source = { parsed: ParsedFile; selected: Set<DataType> };

type State =
  | { step: 'upload' }
  | (Source & { step: 'preview'; previewing: DataType | null })
  | (Source & {
      step: 'playlists';
      review: PlaylistReviewItem[];
      resolutions: Map<number, PlaylistConflictResolution>;
    })
  // `writing`: the import itself runs, so a cancel waits for its summary instead of going back
  | { step: 'busy'; progress: ProgressInfo; writing: boolean; source?: Source }
  | { step: 'done'; result: ImportResult }
  | { step: 'error'; warnings: string[] };

type Action =
  | { type: 'load'; parsed: ParsedFile }
  | { type: 'select'; selected: Set<DataType> }
  | { type: 'preview'; previewing: DataType | null }
  | { type: 'start'; label: MessageKey; writing?: boolean }
  | { type: 'progress'; progress: ProgressInfo }
  | { type: 'review'; review: PlaylistReviewItem[] }
  | { type: 'resolve'; indices: number[]; value: PlaylistConflictResolution }
  | { type: 'back' }
  | { type: 'finish'; result: ImportResult }
  | { type: 'fail'; warnings: string[] }
  | { type: 'reset' };

const sourceOf = (state: State): Source | undefined =>
  state.step === 'preview' || state.step === 'playlists'
    ? { parsed: state.parsed, selected: state.selected }
    : state.step === 'busy'
      ? state.source
      : undefined;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'load': {
      const selected = new Set(getAvailableCounts(action.parsed.data).keys());
      return { step: 'preview', parsed: action.parsed, selected, previewing: null };
    }
    case 'select':
      return state.step === 'preview' ? { ...state, selected: action.selected } : state;
    case 'preview':
      return state.step === 'preview' ? { ...state, previewing: action.previewing } : state;
    case 'start':
      return {
        step: 'busy',
        progress: { current: 0, total: 0, label: t(action.label) },
        writing: !!action.writing,
        source: sourceOf(state),
      };
    case 'progress':
      return state.step === 'busy' ? { ...state, progress: action.progress } : state;
    case 'review': {
      const source = sourceOf(state);
      if (!source) return state;
      const resolutions = new Map(
        action.review.map(({ index, existingUri }) => [
          index,
          existingUri ? CONFLICT_RESOLUTION.SKIP : CONFLICT_RESOLUTION.CREATE_NEW,
        ]),
      );
      return { step: 'playlists', ...source, review: action.review, resolutions };
    }
    case 'resolve':
      if (state.step !== 'playlists') return state;
      return {
        ...state,
        resolutions: new Map([
          ...state.resolutions,
          ...action.indices.map((i) => [i, action.value] as const),
        ]),
      };
    case 'back': {
      const source = sourceOf(state);
      return source ? { step: 'preview', ...source, previewing: null } : { step: 'upload' };
    }
    case 'finish': {
      const { result } = action;
      const allFailed =
        !result.cancelled &&
        result.log.length > 0 &&
        result.log.every((e) => e.status === LOG_STATUS.ERROR);
      return allFailed ? { step: 'error', warnings: result.warnings } : { step: 'done', result };
    }
    case 'fail':
      return { step: 'error', warnings: action.warnings };
    case 'reset':
      return { step: 'upload' };
  }
}

const ImportPage = () => {
  const [state, dispatch] = useReducer(reducer, { step: 'upload' });
  const aborter = useAbortController();

  const runImport = async (
    { parsed, selected }: Source,
    resolutions: Map<number, PlaylistConflictResolution> = new Map(),
    existingUris: Map<string, string> = new Map(),
  ) => {
    const { signal } = aborter.start();
    dispatch({ type: 'start', label: 'progress.starting', writing: true });

    try {
      const result = await importData(
        parsed.data,
        selected,
        resolutions,
        existingUris,
        (progress) => {
          if (!signal.aborted) dispatch({ type: 'progress', progress });
        },
        signal,
        parsed.sourceFormat === SOURCE_FORMAT.OUR_EXPORT,
      );
      dispatch({ type: 'finish', result });
    } catch (e) {
      console.error(`[${__APP_NAME__}] Import failed:`, e);
      dispatch({ type: 'fail', warnings: [errorMessage(e)] });
    }
  };

  const detectConflictsAndImport = async (source: Source) => {
    const playlists = source.parsed.data.playlists;
    if (!source.selected.has(DATA_TYPE.PLAYLISTS) || !playlists?.length) return runImport(source);

    const { signal } = aborter.start();
    dispatch({ type: 'start', label: 'progress.checkingPlaylists' });

    try {
      const existing = new Map<string, string>();
      for (const { name, uri } of await fetchRootlistPlaylists(signal))
        if (!existing.has(name)) existing.set(name, uri);
      if (signal.aborted) return;
      dispatch({
        type: 'review',
        review: playlists.map(({ name, items }, index) => ({
          index,
          name,
          trackCount: items.length,
          existingUri: existing.get(name),
        })),
      });
    } catch (e) {
      if (signal.aborted) return;
      notifyError(e, t('progress.checkingPlaylists'));
      dispatch({ type: 'back' });
    }
  };

  const importFromProfile = async (input: string) => {
    const { signal } = aborter.start();
    dispatch({ type: 'start', label: 'progress.starting' });

    try {
      const { data, userName } = await exportPublicProfile(
        input,
        (progress) => {
          if (!signal.aborted) dispatch({ type: 'progress', progress });
        },
        signal,
      );
      if (signal.aborted) return;
      dispatch({
        type: 'load',
        parsed: { data, sourceFormat: SOURCE_FORMAT.PROFILE, fileName: userName ?? input },
      });
    } catch (e) {
      if (signal.aborted) return;
      if (e instanceof ValidationError) {
        notifyError(e);
        dispatch({ type: 'reset' });
      } else {
        dispatch({ type: 'fail', warnings: [errorMessage(e)] });
      }
    }
  };

  const reset = () => dispatch({ type: 'reset' });
  const goToExport = () => Spicetify.Platform.History.push(`/${__APP_NAME__}`);

  return (
    <PageShell
      title={t('import.title')}
      subtitle={t('import.subtitle')}
      version={__APP_VERSION__}
      navButton={
        <ButtonSecondary onClick={goToExport} buttonSize="md">
          {t('nav.export')}
        </ButtonSecondary>
      }
    >
      {state.step === 'upload' && (
        <FileDropZone
          onProfileImport={importFromProfile}
          onFileSelected={(parsed) => dispatch({ type: 'load', parsed })}
        />
      )}

      {state.step === 'preview' && (
        <>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <TextComponent variant="ballad" weight="bold">
                  {t('import.foundIn', { fileName: state.parsed.fileName })}
                </TextComponent>
                <TextComponent variant="minuet" semanticColor="textSubdued">
                  {t(SOURCE_LABEL[state.parsed.sourceFormat])}
                </TextComponent>
              </div>
              <ButtonTertiary onClick={reset} buttonSize="sm">
                {t('import.chooseDifferent')}
              </ButtonTertiary>
            </div>

            <DataTypeGrid
              selected={state.selected}
              onChange={(selected) => dispatch({ type: 'select', selected })}
              counts={getAvailableCounts(state.parsed.data)}
              onPreview={(previewing) => dispatch({ type: 'preview', previewing })}
            />
          </div>

          <ButtonPrimary
            onClick={() => detectConflictsAndImport(state)}
            disabled={state.selected.size === 0}
            buttonSize="md"
          >
            {t('import.importSelected')}
          </ButtonPrimary>

          {state.previewing && (
            <ContentPreview
              type={state.previewing}
              data={state.parsed.data}
              onClose={() => dispatch({ type: 'preview', previewing: null })}
            />
          )}
        </>
      )}

      {state.step === 'playlists' && (
        <PlaylistReviewCard
          items={state.review}
          resolutions={state.resolutions}
          onResolve={(value, indices) => dispatch({ type: 'resolve', value, indices })}
          onContinue={() =>
            runImport(
              state,
              state.resolutions,
              new Map(
                state.review.flatMap((r) => (r.existingUri ? [[r.name, r.existingUri]] : [])),
              ),
            )
          }
          onCancel={() => dispatch({ type: 'back' })}
        />
      )}

      {state.step === 'busy' && (
        <ProgressCard
          progress={state.progress}
          onCancel={() => {
            aborter.abort();
            if (!state.writing) return dispatch({ type: 'back' });
            dispatch({
              type: 'progress',
              progress: { ...state.progress, label: t('progress.cancelling') },
            });
          }}
        />
      )}

      {state.step === 'done' && (
        <ImportSummary result={state.result} onImportAgain={reset} onGoToExport={goToExport} />
      )}

      {state.step === 'error' && (
        <ErrorCard title={t('import.failed')} warnings={state.warnings} onRetry={reset} />
      )}
    </PageShell>
  );
};

export default ImportPage;
