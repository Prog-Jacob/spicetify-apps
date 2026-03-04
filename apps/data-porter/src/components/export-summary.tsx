import React from 'react';
import { t } from '../i18n';
import { DATA_TYPES } from '../data-types';
import type { ExportData } from '../types/export';
import { ANIMATION_STAGGER_MS } from '../constants';
import {
  ResultCard,
  TextComponent,
  ButtonPrimary,
  SpicetifyIcon,
  ButtonTertiary,
} from '@ui/components';

type ExportSummaryProps = {
  result: ExportData;
  warnings: string[];
  onDownload: () => void;
  onNewExport: () => void;
};

const ExportSummary = ({ result, warnings, onDownload, onNewExport }: ExportSummaryProps) => {
  const items = DATA_TYPES.map(({ labelKey, icon, getCount }) => ({
    label: t(labelKey),
    icon,
    count: getCount(result),
  })).filter((item) => item.count > 0);

  const isPartial = warnings.length > 0;

  return (
    <ResultCard
      variant={isPartial ? 'warning' : 'success'}
      title={isPartial ? t('summary.partial') : t('summary.complete')}
      actions={
        <>
          <ButtonPrimary
            onClick={() => {
              onDownload();
              onNewExport();
            }}
            buttonSize="md"
            iconLeading={() => <SpicetifyIcon icon="download" size={16} />}
          >
            {t('download')}
          </ButtonPrimary>
          <ButtonTertiary onClick={onNewExport} buttonSize="md">
            {t('cancel')}
          </ButtonTertiary>
        </>
      }
    >
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map(({ label, count, icon }, i) => (
            <div
              key={label}
              className="flex animate-fade-in-up items-center gap-3 rounded-lg bg-spice-highlight/50 p-3"
              style={{ animationDelay: `${i * ANIMATION_STAGGER_MS.SUMMARY_ITEM}ms` }}
            >
              <SpicetifyIcon icon={icon} className="shrink-0 text-spice-subtext" />
              <div className="flex flex-col">
                <TextComponent variant="alto" weight="bold">
                  {t.number(count)}
                </TextComponent>
                <TextComponent variant="minuet" semanticColor="textSubdued">
                  {label}
                </TextComponent>
              </div>
            </div>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-lg bg-spice-notification-error/10 p-3">
          {warnings.map((w) => (
            <TextComponent key={w} variant="minuet" semanticColor="textNegative">
              {w}
            </TextComponent>
          ))}
        </div>
      )}
    </ResultCard>
  );
};

export default ExportSummary;
