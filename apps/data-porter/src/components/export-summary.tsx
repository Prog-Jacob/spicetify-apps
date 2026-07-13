import { t } from '../i18n';
import React, { useState } from 'react';
import { ALL_DATA_TYPES } from '../data-types';
import ContentPreview from './content-preview';
import { ANIMATION_STAGGER_MS } from '../constants';
import type { DataType, ExportData } from '../types/export';
import {
  ResultCard,
  SummaryTile,
  SpicetifyIcon,
  ButtonPrimary,
  WarningBanner,
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
            <SummaryTile
              key={type}
              icon={icon}
              value={t.number(count)}
              label={label}
              animationDelay={`${i * ANIMATION_STAGGER_MS.SUMMARY_ITEM}ms`}
              onClick={() => setPreviewing(type)}
              trailing={
                <SpicetifyIcon
                  icon="chevron-right"
                  size={12}
                  className="ms-auto shrink-0 text-spice-subtext/50 rtl:rotate-180"
                />
              }
            />
          ))}
        </div>
      )}

      <WarningBanner warnings={warnings} />

      {previewing && (
        <ContentPreview type={previewing} data={result} onClose={() => setPreviewing(null)} />
      )}
    </ResultCard>
  );
};

export default ExportSummary;
