import React from 'react';
import StatusHeader from './status-header';
import { DATA_TYPES } from '../data-types';
import type { ExportData } from '../types/export';
import { SpicetifyIcon } from '@ui/components/ui/icon';
import { Card, CardContent } from '@ui/components/ui/card';

const { TextComponent, ButtonPrimary, ButtonTertiary } = Spicetify.ReactComponent;

type ExportSummaryProps = {
  result: ExportData;
  warnings: string[];
  onDownload: () => void;
  onNewExport: () => void;
};

const ExportSummary = ({ result, warnings, onDownload, onNewExport }: ExportSummaryProps) => {
  const items = DATA_TYPES.map(({ label, icon, getCount }) => ({
    label,
    icon,
    count: getCount(result),
  })).filter((item) => item.count > 0);

  const isPartial = warnings.length > 0;

  return (
    <Card className="animate-fade-in-up border-0 py-5">
      <CardContent className="flex flex-col gap-5">
        <StatusHeader
          variant={isPartial ? 'warning' : 'success'}
          title={isPartial ? 'Partially Complete' : 'Export Complete'}
        />

        {items.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map(({ label, count, icon }, i) => (
              <div
                key={label}
                className="flex animate-fade-in-up items-center gap-3 rounded-lg bg-spice-highlight/50 p-3"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <SpicetifyIcon icon={icon} className="shrink-0 text-spice-subtext" />
                <div className="flex flex-col">
                  <TextComponent variant="alto" weight="bold">
                    {count.toLocaleString()}
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

        <div className="flex gap-3">
          <ButtonPrimary
            onClick={() => {
              onDownload();
              onNewExport();
              Spicetify.showNotification('File downloaded');
            }}
            buttonSize="md"
            iconLeading={() => <SpicetifyIcon icon="download" size={16} />}
          >
            Download
          </ButtonPrimary>
          <ButtonTertiary onClick={onNewExport} buttonSize="md">
            Cancel
          </ButtonTertiary>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportSummary;
