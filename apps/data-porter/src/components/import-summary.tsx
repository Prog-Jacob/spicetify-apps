import { t } from '../i18n';
import { cn } from '@shared/lib';
import React, { useMemo, useState } from 'react';
import type { ImportResult, LogStatus } from '../types/import';
import { LOG_STATUS, ANIMATION_STAGGER_MS } from '../constants';
import {
  FilterBar,
  ResultCard,
  SummaryTile,
  TextComponent,
  ButtonPrimary,
  SpicetifyIcon,
  WarningBanner,
  ButtonTertiary,
} from '@ui/components';

const FILTER_BAR_THRESHOLD = 10;

const STATUS_CONFIG: Record<LogStatus, { icon: Spicetify.Icon; colorClass: string }> = {
  [LOG_STATUS.OK]: { icon: 'check-alt-fill', colorClass: 'text-spice-button' },
  [LOG_STATUS.SKIPPED]: { icon: 'minus', colorClass: 'text-spice-subtext' },
  [LOG_STATUS.ERROR]: { icon: 'x', colorClass: 'text-spice-notification-error' },
};

const TILE_DEFS: { status: LogStatus; labelKey: Parameters<typeof t>[0] }[] = [
  { status: LOG_STATUS.OK, labelKey: 'summary.succeeded' },
  { status: LOG_STATUS.SKIPPED, labelKey: 'summary.skipped' },
  { status: LOG_STATUS.ERROR, labelKey: 'summary.failed' },
];

type ImportSummaryProps = {
  result: ImportResult;
  onImportAgain: () => void;
  onGoToExport: () => void;
};

const ImportSummary = ({ result, onImportAgain, onGoToExport }: ImportSummaryProps) => {
  const isPartial = result.warnings.length > 0;
  const [activeFilter, setActiveFilter] = useState<LogStatus | null>(null);
  const [filterText, setFilterText] = useState('');

  const counts = useMemo(
    () =>
      result.log.reduce(
        (acc, e) => {
          acc[e.status] = (acc[e.status] || 0) + 1;
          return acc;
        },
        {} as Partial<Record<LogStatus, number>>,
      ),
    [result.log],
  );

  const tiles = useMemo(
    () =>
      TILE_DEFS.map(({ status, labelKey }) => ({
        status,
        labelKey,
        ...STATUS_CONFIG[status],
        count: counts[status] ?? 0,
      })).filter((tile) => tile.count > 0),
    [counts],
  );

  const filteredLog = useMemo(() => {
    let entries = result.log;
    if (activeFilter) entries = entries.filter((e) => e.status === activeFilter);
    if (filterText) {
      const needle = filterText.toLowerCase();
      entries = entries.filter(
        (e) => e.label.toLowerCase().includes(needle) || e.detail?.toLowerCase().includes(needle),
      );
    }
    return entries;
  }, [result.log, activeFilter, filterText]);

  const baseCount = activeFilter ? (counts[activeFilter] ?? 0) : result.log.length;

  const showFilterBar = baseCount > FILTER_BAR_THRESHOLD;

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
      {tiles.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-3">
          {tiles.map(({ status, labelKey, icon, colorClass, count }, i) => (
            <SummaryTile
              key={status}
              icon={icon}
              iconClassName={colorClass}
              value={t.number(count)}
              label={t(labelKey)}
              active={activeFilter === status}
              animationDelay={`${i * ANIMATION_STAGGER_MS.SUMMARY_ITEM}ms`}
              onClick={() => {
                setActiveFilter((prev) => (prev === status ? null : status));
                setFilterText('');
              }}
            />
          ))}
        </div>
      )}

      {result.log.length > 0 && (
        <div className="flex flex-col gap-2">
          {showFilterBar && (
            <FilterBar
              value={filterText}
              total={baseCount}
              filtered={filteredLog.length}
              onChange={setFilterText}
            />
          )}
          <div
            className="overflow-y-auto rounded-lg bg-spice-highlight/20"
            style={{ maxHeight: 'min(20rem, 40vh)' }}
            role="list"
          >
            {filteredLog.map((entry, i) => (
              <LogEntry key={i} entry={entry} />
            ))}
          </div>
        </div>
      )}

      <WarningBanner warnings={result.warnings} />
    </ResultCard>
  );
};

const LogEntry = React.memo(({ entry }: { entry: ImportResult['log'][number] }) => {
  const { icon, colorClass } = STATUS_CONFIG[entry.status];
  return (
    <div role="listitem" className="flex items-start gap-2.5 px-4 py-2">
      <SpicetifyIcon icon={icon} size={14} className={cn('mt-0.5 shrink-0', colorClass)} />
      <div className="flex min-w-0 flex-col">
        <TextComponent variant="mesto">{entry.label}</TextComponent>
        {entry.detail && (
          <TextComponent variant="minuet" semanticColor="textSubdued">
            {entry.detail}
          </TextComponent>
        )}
      </div>
    </div>
  );
});

export default ImportSummary;
