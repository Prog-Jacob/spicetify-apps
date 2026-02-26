import React from 'react';
import { t } from '../i18n';
import { cn } from '@shared/lib';
import { LOG_STATUS } from '../constants';
import type { ImportResult } from '../types/import';
import { SpicetifyIcon, ResultCard } from '@ui/components';

const { TextComponent, ButtonPrimary, ButtonTertiary } = Spicetify.ReactComponent;

const LOG_STATUS_STYLES: Record<
  ImportResult['log'][number]['status'],
  { icon: Spicetify.Icon; colorClass: string }
> = {
  [LOG_STATUS.SKIPPED]: { icon: 'minus', colorClass: 'text-spice-subtext' },
  [LOG_STATUS.OK]: { icon: 'check-alt-fill', colorClass: 'text-spice-button' },
  [LOG_STATUS.ERROR]: { icon: 'x', colorClass: 'text-spice-notification-error' },
};

type ImportSummaryProps = {
  result: ImportResult;
  onImportAgain: () => void;
  onGoToExport: () => void;
};

const ImportSummary = ({ result, onImportAgain, onGoToExport }: ImportSummaryProps) => {
  const isPartial = result.warnings.length > 0;

  return (
    <ResultCard
      variant={isPartial ? 'warning' : 'success'}
      title={isPartial ? t('summary.partial') : t('summary.complete')}
      actions={
        <>
          <ButtonPrimary onClick={onImportAgain} buttonSize="md">
            {t('summary.importAgain')}
          </ButtonPrimary>
          <ButtonTertiary onClick={onGoToExport} buttonSize="md">
            {t('summary.goToExport')}
          </ButtonTertiary>
        </>
      }
    >
      {result.log.length > 0 && (
        <div className="flex max-h-96 flex-col gap-1.5 overflow-y-auto rounded-lg bg-spice-highlight/30 p-3">
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
    </ResultCard>
  );
};

export default ImportSummary;
