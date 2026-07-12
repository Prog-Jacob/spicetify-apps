import { cn } from '@shared/lib';
import { t, type MessageKey } from '../i18n';
import React, { useMemo, useState } from 'react';
import { ANIMATION_STAGGER_MS, CONFLICT_RESOLUTION } from '../constants';
import type { PlaylistReviewItem, PlaylistConflictResolution } from '../types/import';
import {
  Pill,
  FilterBar,
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
  canMerge?: boolean;
  ariaLabel?: string;
};

const ResolutionPicker = ({
  active,
  onChange,
  canMerge = true,
  ariaLabel,
}: ResolutionPickerProps) => {
  const options = canMerge
    ? RESOLUTIONS
    : RESOLUTIONS.filter((r) => r.value !== CONFLICT_RESOLUTION.MERGE);
  return (
    <div className="flex items-center gap-2" role="radiogroup" aria-label={ariaLabel}>
      {options.map(({ value, labelKey }, i) => (
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
};

type PlaylistReviewCardProps = {
  items: PlaylistReviewItem[];
  resolutions: Map<number, PlaylistConflictResolution>;
  onResolutionChange: (index: number, value: PlaylistConflictResolution) => void;
  onApplyAll: (value: PlaylistConflictResolution, indices: number[]) => void;
  onContinue: () => void;
  onCancel: () => void;
};

const PlaylistReviewCard = ({
  items,
  resolutions,
  onResolutionChange,
  onApplyAll,
  onContinue,
  onCancel,
}: PlaylistReviewCardProps) => {
  const [filter, setFilter] = useState('');
  const filtered = useMemo(
    () => items.filter((item) => item.name.toLowerCase().includes(filter.toLowerCase())),
    [filter, items],
  );
  const allSame = useMemo(() => {
    const first = resolutions.get(filtered[0]?.index);
    return filtered.every((item) => resolutions.get(item.index) === first) ? first : undefined;
  }, [filtered, resolutions]);
  const filteredCanMerge = useMemo(() => filtered.every((item) => !!item.existingUri), [filtered]);

  return (
    <ResultCard
      variant="warning"
      title={t('conflict.title', { count: items.length })}
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
        <FilterBar
          value={filter}
          total={items.length}
          filtered={filtered.length}
          onChange={setFilter}
          className="px-4 py-3"
        />

        <div className="overflow-y-auto" role="list">
          {filtered.length >= 2 && (
            <div className="sticky top-0 z-10 mx-4 flex items-center justify-between border-b border-spice-subtext/40 bg-spice-card pb-3">
              <TextComponent variant="ballad" semanticColor="textSubdued">
                {t('conflict.applyToAll')}
              </TextComponent>
              <ResolutionPicker
                active={allSame}
                onChange={(v) =>
                  onApplyAll(
                    v,
                    filtered.map((item) => item.index),
                  )
                }
                canMerge={filteredCanMerge}
                ariaLabel={t('conflict.applyToAll')}
              />
            </div>
          )}

          {filtered.map(({ index, name, trackCount, existingUri }, i) => (
            <div
              role="listitem"
              key={index}
              className="animate-fade-in-up flex items-center justify-between px-4 py-2.5 hover:bg-spice-highlight/10"
              style={{ animationDelay: `${i * ANIMATION_STAGGER_MS.LIST_ITEM}ms` }}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <SpicetifyIcon icon="playlist" size={16} className="text-spice-subtext" />
                <TextComponent variant="mesto" weight="bold" className="truncate">
                  {name}
                </TextComponent>
                <TextComponent variant="minuet" semanticColor="textSubdued" className="shrink-0">
                  {t('dataType.itemCount', { count: trackCount })}
                </TextComponent>
                {existingUri && (
                  <Pill variant="error" className="shrink-0">
                    {t('conflict.exists')}
                  </Pill>
                )}
              </div>
              <ResolutionPicker
                active={resolutions.get(index)}
                onChange={(v) => onResolutionChange(index, v)}
                canMerge={!!existingUri}
                ariaLabel={t('conflict.resolutionFor', { name })}
              />
            </div>
          ))}
        </div>
      </div>
    </ResultCard>
  );
};

export default PlaylistReviewCard;
