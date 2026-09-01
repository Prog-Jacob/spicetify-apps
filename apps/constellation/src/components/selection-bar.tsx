import React from 'react';
import { t } from '../i18n';
import { cn } from '@shared/lib';
import type { NodeType } from '../types/graph';
import RemoveTypeMenu from './remove-type-menu';
import { PATH_DETOUR } from '../graph/paths-between';
import { PANEL_SURFACE, ACTION_BUTTON } from '../styles/chrome';
import { ToggleChip, SpicetifyIcon, Slider, Divider } from '@ui/components';

type Props = {
  count: number;
  undoCount: number;
  pathMode: boolean;
  onTogglePath: () => void;
  detour: number;
  onDetourChange: (value: number) => void;
  removeTypes: NodeType[];
  onRemove: (keep: Set<NodeType>) => void;
  onUndo: () => void;
  onClear: () => void;
};

const SelectionBar = ({
  count,
  undoCount,
  pathMode,
  onTogglePath,
  detour,
  onDetourChange,
  removeTypes,
  onRemove,
  onUndo,
  onClear,
}: Props) => {
  const canPath = count >= 2;
  return (
    <div
      className={cn(
        'animate-fade-in-up flex max-w-full items-center gap-2 overflow-x-auto py-1.5 pe-1.5 ps-3.5',
        PANEL_SURFACE,
      )}
    >
      {undoCount > 0 && (
        <button type="button" onClick={onUndo} className={ACTION_BUTTON}>
          <SpicetifyIcon icon="skip-back" size={11} />
          {t('selection.undo', { count: undoCount })}
        </button>
      )}
      {count > 0 && (
        <>
          <span className="shrink-0 text-xs font-semibold tabular-nums text-spice-text">
            {t('selection.count', { count })}
          </span>
          <Divider />
        </>
      )}
      {canPath && (
        <ToggleChip active={pathMode} onToggle={onTogglePath} variant="outline">
          <span className="flex items-center gap-1.5">
            <SpicetifyIcon icon="enhance" size={11} />
            {t('selection.paths')}
          </span>
        </ToggleChip>
      )}
      {pathMode && (
        <Slider
          compact
          className="w-40"
          label={t('selection.detour')}
          ariaLabel={t('selection.detourHint')}
          value={detour}
          min={PATH_DETOUR.min}
          max={PATH_DETOUR.max}
          step={1}
          valueLabel={`+${detour}`}
          onChange={onDetourChange}
        />
      )}
      {count > 0 && (
        <>
          {canPath && <Divider />}
          <RemoveTypeMenu variant="bar" types={removeTypes} onRemove={onRemove} />
          <button
            type="button"
            onClick={onClear}
            className={ACTION_BUTTON}
            aria-label={t('selection.clear')}
          >
            <SpicetifyIcon icon="x" size={11} />
          </button>
        </>
      )}
    </div>
  );
};

export default SelectionBar;
