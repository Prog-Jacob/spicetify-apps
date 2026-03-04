import { cn } from '@shared/lib';
import { t, type MessageKey } from '../i18n';
import React, { useMemo, useState } from 'react';
import { ANIMATION_STAGGER_MS, CONFLICT_RESOLUTION } from '../constants';
import type { PlaylistConflict, PlaylistConflictResolution } from '../types/import';
import {
  Input,
  ResultCard,
  SpicetifyIcon,
  TextComponent,
  ButtonPrimary,
  ButtonTertiary,
} from '@ui/components';

const RESOLUTIONS: { value: PlaylistConflictResolution; labelKey: MessageKey }[] = [
  { value: CONFLICT_RESOLUTION.SKIP, labelKey: 'conflict.skip' },
  { value: CONFLICT_RESOLUTION.MERGE, labelKey: 'conflict.merge' },
  { value: CONFLICT_RESOLUTION.CREATE_NEW, labelKey: 'conflict.createNew' },
];

type ResolutionPickerProps = {
  active?: PlaylistConflictResolution;
  onChange: (value: PlaylistConflictResolution) => void;
  ariaLabel?: string;
};

const ResolutionPicker = ({ active, onChange, ariaLabel }: ResolutionPickerProps) => (
  <div className="flex items-center gap-2" role="radiogroup" aria-label={ariaLabel}>
    {RESOLUTIONS.map(({ value, labelKey }, i) => (
      <React.Fragment key={value}>
        {i > 0 && <span className="text-spice-subtext/50">&middot;</span>}
        <button
          type="button"
          role="radio"
          aria-checked={active === value}
          onClick={() => onChange(value)}
          className={cn(
            'cursor-pointer border-0 bg-transparent p-0 text-sm',
            active === value
              ? 'font-semibold text-spice-button'
              : 'text-spice-subtext hover:text-spice-text',
          )}
        >
          {t(labelKey)}
        </button>
      </React.Fragment>
    ))}
  </div>
);

type ConflictCardProps = {
  conflicts: PlaylistConflict[];
  resolutions: Map<string, PlaylistConflictResolution>;
  onResolutionChange: (name: string, value: PlaylistConflictResolution) => void;
  onApplyAll: (value: PlaylistConflictResolution, names: string[]) => void;
  onContinue: () => void;
  onCancel: () => void;
};

const ConflictCard = ({
  conflicts,
  resolutions,
  onResolutionChange,
  onApplyAll,
  onContinue,
  onCancel,
}: ConflictCardProps) => {
  const l = (s: string) => s.toLowerCase();
  const [filter, setFilter] = useState('');
  const filtered = useMemo(
    () => conflicts.filter((c) => l(c.importedName).includes(l(filter))),
    [filter, conflicts],
  );
  const allSame = useMemo(() => {
    const first = resolutions.get(filtered[0]?.importedName);
    return filtered.every((c) => resolutions.get(c.importedName) === first) ? first : undefined;
  }, [filtered, resolutions]);

  return (
    <ResultCard
      variant="warning"
      title={t('conflict.title', { count: conflicts.length })}
      actions={
        <>
          <ButtonPrimary onClick={onContinue} buttonSize="md">
            {t('conflict.continue')}
          </ButtonPrimary>
          <ButtonTertiary onClick={onCancel} buttonSize="md">
            {t('cancel')}
          </ButtonTertiary>
        </>
      }
    >
      <div className="flex max-h-96 flex-col overflow-hidden rounded-lg border border-spice-highlight/20">
        <div className="flex items-center gap-3 px-4 py-3">
          <Input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t('conflict.filter')}
            aria-label={t('conflict.filter')}
          />
          <TextComponent variant="minuet" semanticColor="textSubdued">
            {t('conflict.showing', { filtered: filtered.length, total: conflicts.length })}
          </TextComponent>
        </div>

        {filtered.length >= 2 && (
          <div className="mx-4 flex items-center justify-between border-b border-spice-subtext/40 pb-3">
            <TextComponent variant="ballad" semanticColor="textSubdued">
              {t('conflict.applyToAll')}
            </TextComponent>
            <ResolutionPicker
              active={allSame}
              onChange={(v) =>
                onApplyAll(
                  v,
                  filtered.map((c) => c.importedName),
                )
              }
              ariaLabel={t('conflict.applyToAll')}
            />
          </div>
        )}

        <div className="overflow-y-auto [scrollbar-gutter:stable]" role="list">
          {filtered.map(({ importedName }, i) => (
            <div
              role="listitem"
              key={importedName}
              className="animate-fade-in-up flex items-center justify-between px-4 py-2.5 hover:bg-spice-highlight/10"
              style={{ animationDelay: `${i * ANIMATION_STAGGER_MS.CONFLICT_ITEM}ms` }}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <SpicetifyIcon icon="playlist" size={16} className="text-spice-subtext" />
                <TextComponent variant="mesto" weight="bold" className="truncate">
                  {importedName}
                </TextComponent>
              </div>
              <ResolutionPicker
                active={resolutions.get(importedName)}
                onChange={(v) => onResolutionChange(importedName, v)}
                ariaLabel={t('conflict.resolutionFor', { name: importedName })}
              />
            </div>
          ))}
        </div>
      </div>
    </ResultCard>
  );
};

export default ConflictCard;
