import React from 'react';
import { t } from '../i18n';
import { cn } from '@shared/lib';
import { PATH_RADIUS } from '../graph/common-neighborhood';
import { PANEL_SURFACE, ACTION_BUTTON } from './chrome-styles';
import { ToggleChip, SpicetifyIcon, Slider } from '@ui/components';

type Props = {
  count: number;
  pathMode: boolean;
  onTogglePath: () => void;
  radius: number;
  onRadiusChange: (value: number) => void;
  onRemove: () => void;
  onClear: () => void;
};

const Divider = () => <span className="h-4 w-px bg-spice-subtext/20" />;

const SelectionBar = ({
  count,
  pathMode,
  onTogglePath,
  radius,
  onRadiusChange,
  onRemove,
  onClear,
}: Props) => {
  const canPath = count >= 2;
  return (
    <div
      className={cn(
        'animate-fade-in-up flex items-center gap-2 py-1.5 pe-1.5 ps-3.5',
        PANEL_SURFACE,
      )}
    >
      <span className="text-xs font-semibold tabular-nums text-spice-text">
        {t('selection.count', { count })}
      </span>
      <Divider />
      {canPath && (
        <ToggleChip active={pathMode} onToggle={onTogglePath} variant="outline">
          <span className="flex items-center gap-1.5">
            <SpicetifyIcon icon="enhance" size={11} />
            {t('selection.paths')}
          </span>
        </ToggleChip>
      )}
      {canPath && pathMode && (
        <Slider
          compact
          className="w-40"
          label={t('selection.reach')}
          ariaLabel={t('selection.reach')}
          value={radius}
          min={PATH_RADIUS.min}
          max={PATH_RADIUS.max}
          step={1}
          valueLabel={radius}
          onChange={onRadiusChange}
        />
      )}
      {canPath && <Divider />}
      <button type="button" onClick={onRemove} className={ACTION_BUTTON}>
        <SpicetifyIcon icon="minus" size={11} />
        {t('selection.remove')}
      </button>
      <button
        type="button"
        onClick={onClear}
        className={ACTION_BUTTON}
        aria-label={t('selection.clear')}
      >
        <SpicetifyIcon icon="x" size={11} />
      </button>
    </div>
  );
};

export default SelectionBar;
