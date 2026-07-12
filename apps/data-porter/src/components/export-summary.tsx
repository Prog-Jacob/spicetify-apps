import { t } from '../i18n';
import React, { useState } from 'react';
import { ALL_DATA_TYPES } from '../data-types';
import ContentPreview from './content-preview';
import { ANIMATION_STAGGER_MS } from '../constants';
import type { DataType, ExportData } from '../types/export';
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
  const [previewing, setPreviewing] = useState<DataType | null>(null);

  const items = ALL_DATA_TYPES.map(({ type, labelKey, icon, getCount }) => ({
    type,
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
            onClick={onDownload}
            buttonSize="md"
            iconLeading={() => <SpicetifyIcon icon="download" size={16} />}
          >
            {t('download')}
          </ButtonPrimary>
          <ButtonTertiary onClick={onNewExport} buttonSize="md">
            {t('summary.newExport')}
          </ButtonTertiary>
        </>
      }
    >
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map(({ type, label, count, icon }, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setPreviewing(type)}
              className="flex animate-fade-in-up cursor-pointer items-center gap-3 rounded-lg border-0 bg-spice-highlight/50 p-3 text-start transition-colors hover:bg-spice-highlight/80"
              style={{ animationDelay: `${i * ANIMATION_STAGGER_MS.SUMMARY_ITEM}ms` }}
            >
              <SpicetifyIcon icon={icon} className="shrink-0 text-spice-subtext" />
              <div className="flex min-w-0 flex-col">
                <TextComponent variant="alto" weight="bold">
                  {t.number(count)}
                </TextComponent>
                <TextComponent variant="minuet" semanticColor="textSubdued">
                  {label}
                </TextComponent>
              </div>
              <SpicetifyIcon
                icon="chevron-right"
                size={12}
                className="ms-auto shrink-0 text-spice-subtext/50 rtl:rotate-180"
              />
            </button>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-lg bg-spice-notification-error/10 p-3">
          {warnings.map((w, i) => (
            <TextComponent key={i} variant="minuet" semanticColor="textNegative">
              {w}
            </TextComponent>
          ))}
        </div>
      )}

      {previewing && (
        <ContentPreview type={previewing} data={result} onClose={() => setPreviewing(null)} />
      )}
    </ResultCard>
  );
};

export default ExportSummary;
