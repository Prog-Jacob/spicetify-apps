import React from 'react';
import { t } from '../i18n';
import { cn } from '@shared/lib';
import { PANEL_SURFACE } from '@ui/styles';
import type { NodeType } from '../types/graph';
import { PATH_DETOUR } from '../graph/paths-between';
import { RemoveSplitButton } from './remove-type-menu';
import { Divider, ToggleChip, ActionButton, InlineSlider, SpicetifyIcon } from '@ui/components';

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
        <ActionButton icon="skip-back" onClick={onUndo}>
          {t('selection.undo', { count: undoCount })}
        </ActionButton>
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
          <SpicetifyIcon icon="enhance" size={11} />
          {t('selection.paths')}
        </ToggleChip>
      )}
      {pathMode && (
        <InlineSlider
          className="w-40"
          label={t('selection.detour')}
          aria-label={t('selection.detourHint')}
          value={detour}
          min={PATH_DETOUR.min}
          max={PATH_DETOUR.max}
          step={1}
          valueLabel={t('selection.detourValue', { value: detour })}
          onChange={onDetourChange}
        />
      )}
      {count > 0 && (
        <>
          {canPath && <Divider />}
          <RemoveSplitButton types={removeTypes} onRemove={onRemove} />
          <ActionButton icon="x" onClick={onClear} aria-label={t('selection.clear')} />
        </>
      )}
    </div>
  );
};

export default SelectionBar;
