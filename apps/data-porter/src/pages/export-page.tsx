import { cn } from '@shared/lib/utils';
import StatusHeader from './status-header';
import { DATA_TYPES } from '../data-types';
import DataTypeCard from './data-type-card';
import ExportSummary from './export-summary';
import { Progress } from '@ui/components/ui/progress';
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@ui/components/ui/card';
import { exportData, downloadJson } from '../services/exporter';
import type { DataType, ExportData, ExportProgress } from '../types/export';

const { TextComponent, ButtonPrimary, ButtonTertiary } = Spicetify.ReactComponent;

type Status = 'idle' | 'fetching' | 'done' | 'error';

const ExportPage = () => {
  const [selected, setSelected] = useState<Set<DataType>>(new Set());
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [result, setResult] = useState<ExportData | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [warnings, setWarnings] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  const toggle = (type: DataType) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const startExport = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('fetching');
    setResult(null);
    setWarnings([]);
    setProgress({ current: 0, total: 0, label: 'Starting...' });

    try {
      const { data, warnings: w } = await exportData(selected, setProgress, controller.signal);
      setResult(data);
      setWarnings(w);
      setStatus(w.length > 0 && !data.playlists && !data.library ? 'error' : 'done');
    } catch {
      if (!controller.signal.aborted) setStatus('error');
    } finally {
      setProgress(null);
    }
  };

  const resetExport = () => {
    setStatus('idle');
    setResult(null);
    setWarnings([]);
  };

  const allSelected = selected.size === DATA_TYPES.length;
  const isFetching = status === 'fetching';
  const progressPercent =
    progress && progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 p-6">
      <div className="flex flex-col gap-2">
        <TextComponent variant="canon" weight="bold">
          Export Your Data
        </TextComponent>
        <TextComponent variant="viola" semanticColor="textSubdued">
          Choose what to include, then download as JSON.
        </TextComponent>
      </div>

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

        <div
          className={cn(
            'grid grid-cols-1 gap-3 sm:grid-cols-2',
            isFetching && 'pointer-events-none opacity-50 transition-opacity duration-300',
          )}
        >
          {DATA_TYPES.map(({ type, label, description, icon }) => (
            <DataTypeCard
              key={type}
              icon={icon}
              label={label}
              description={description}
              selected={selected.has(type)}
              disabled={isFetching}
              onToggle={() => toggle(type)}
            />
          ))}
        </div>
      </div>

      {status === 'idle' && (
        <ButtonPrimary onClick={startExport} disabled={selected.size === 0} buttonSize="md">
          Export Selected
        </ButtonPrimary>
      )}

      {isFetching && progress && (
        <Card className="animate-fade-in-up border-0 py-5">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <TextComponent variant="mesto" weight="bold">
                {progress.label}
              </TextComponent>
              {progress.total > 0 && (
                <TextComponent variant="minuet" semanticColor="textSubdued">
                  {progress.current} / {progress.total}
                </TextComponent>
              )}
            </div>

            <Progress
              value={progressPercent}
              aria-label={progress.label}
              indicatorClassName="bg-gradient-to-r from-spice-button via-spice-button-active to-spice-button bg-[length:200%_100%] animate-shimmer"
            />

            <ButtonTertiary
              onClick={() => {
                abortRef.current?.abort();
                setStatus('idle');
                setProgress(null);
              }}
              buttonSize="sm"
            >
              Cancel
            </ButtonTertiary>
          </CardContent>
        </Card>
      )}

      {status === 'done' && result && (
        <ExportSummary
          result={result}
          warnings={warnings}
          onDownload={() => downloadJson(result)}
          onNewExport={resetExport}
        />
      )}

      {status === 'error' && (
        <Card className="animate-fade-in-up border-0 bg-spice-notification-error/10 py-5">
          <CardContent className="flex flex-col gap-4">
            <StatusHeader
              icon="x"
              iconClassName="bg-spice-notification-error/20 text-spice-notification-error"
              title="Export Failed"
              semanticColor="textNegative"
            />
            {warnings.map((w) => (
              <TextComponent key={w} variant="mesto" semanticColor="textNegative">
                {w}
              </TextComponent>
            ))}
            <ButtonPrimary onClick={resetExport} buttonSize="md">
              Try Again
            </ButtonPrimary>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExportPage;
