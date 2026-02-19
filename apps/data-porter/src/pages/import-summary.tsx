import React from 'react';
import { cn } from '@shared/lib/utils';
import StatusHeader from './status-header';
import type { ImportResult } from '../types/import';
import { SpicetifyIcon } from '@ui/components/ui/icon';
import { Card, CardContent } from '@ui/components/ui/card';

const { TextComponent, ButtonPrimary, ButtonTertiary } = Spicetify.ReactComponent;

const LOG_STATUS_STYLES: Record<
  ImportResult['log'][number]['status'],
  { icon: Spicetify.Icon; colorClass: string }
> = {
  ok: { icon: 'check-alt-fill', colorClass: 'text-spice-button' },
  skipped: { icon: 'minus', colorClass: 'text-spice-subtext' },
  error: { icon: 'x', colorClass: 'text-spice-notification-error' },
};

type ImportSummaryProps = {
  result: ImportResult;
  onImportAgain: () => void;
  onGoToExport: () => void;
};

const ImportSummary = ({ result, onImportAgain, onGoToExport }: ImportSummaryProps) => {
  const isPartial = result.warnings.length > 0;

  return (
    <Card className="animate-fade-in-up border-0 py-5">
      <CardContent className="flex flex-col gap-5">
        <StatusHeader
          variant={isPartial ? 'warning' : 'success'}
          title={isPartial ? 'Import Partially Complete' : 'Import Complete'}
        />

        {result.log.length > 0 && (
          <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto rounded-lg bg-spice-highlight/30 p-3">
            {result.log.map((entry, i) => {
              const { icon, colorClass } = LOG_STATUS_STYLES[entry.status];
              return (
                <div key={i} className="flex items-start gap-2">
                  <SpicetifyIcon
                    icon={icon}
                    size={14}
                    className={cn('mt-0.5 shrink-0', colorClass)}
                  />
                  <div className="flex flex-col">
                    <TextComponent variant="minuet">{entry.label}</TextComponent>
                    {entry.detail && (
                      <TextComponent variant="minuet" semanticColor="textSubdued">
                        {entry.detail}
                      </TextComponent>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-3">
          <ButtonPrimary onClick={onImportAgain} buttonSize="md">
            Import Again
          </ButtonPrimary>
          <ButtonTertiary onClick={onGoToExport} buttonSize="md">
            Go to Export
          </ButtonTertiary>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportSummary;
