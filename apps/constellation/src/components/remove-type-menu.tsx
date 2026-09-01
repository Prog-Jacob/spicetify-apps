import { t } from '../i18n';
import { TypeChip } from './type-filter';
import { cn, toggleInSet } from '@shared/lib';
import type { NodeType } from '../types/graph';
import { NODE_LEGEND_ORDER } from '../graph/node-style';
import React, { useId, useState, useCallback } from 'react';
import { SECTION_LABEL, ACTION_BUTTON } from '../styles/chrome';
import { SpicetifyIcon, ButtonSecondary } from '@ui/components';

type Variant = 'bar' | 'row';

type Props = {
  types: NodeType[];
  onRemove: (keep: Set<NodeType>) => void;
  variant: Variant;
};

const ordered = (types: NodeType[]): NodeType[] =>
  NODE_LEGEND_ORDER.filter((type) => types.includes(type));

// `bar` fuses remove + chevron into one split button; `row` sits among the inspector's native pills.
const RemoveButton = ({
  variant,
  split,
  onClick,
}: {
  variant: Variant;
  split: boolean;
  onClick: () => void;
}) =>
  variant === 'row' ? (
    <ButtonSecondary buttonSize="sm" onClick={onClick}>
      <span className="flex items-center gap-1.5">
        <SpicetifyIcon icon="minus" size={14} />
        {t('inspector.remove')}
      </span>
    </ButtonSecondary>
  ) : (
    <button
      type="button"
      onClick={onClick}
      className={cn(ACTION_BUTTON, split && 'rounded-e-none')}
    >
      <SpicetifyIcon icon="minus" size={11} />
      {t('selection.remove')}
    </button>
  );

const OptionsToggle = ({
  variant,
  open,
  controls,
  onClick,
}: {
  variant: Variant;
  open: boolean;
  controls: string;
  onClick: () => void;
}) => {
  const chevron = (
    <SpicetifyIcon icon="chevron-right" size={11} className={open ? '-rotate-90' : 'rotate-90'} />
  );
  const props = {
    'aria-label': t('selection.removeOptions'),
    'aria-expanded': open,
    'aria-controls': controls,
    onClick,
  };
  return variant === 'row' ? (
    <ButtonSecondary buttonSize="sm" {...props}>
      {chevron}
    </ButtonSecondary>
  ) : (
    <button
      type="button"
      {...props}
      className={cn(ACTION_BUTTON, 'rounded-s-none border-s-0 px-1.5')}
    >
      {chevron}
    </button>
  );
};

const RemoveTypeMenu = ({ types, onRemove, variant }: Props) => {
  const chipsId = useId();
  const [open, setOpen] = useState(false);
  const [kept, setKept] = useState<Set<NodeType>>(() => new Set());
  const gateable = ordered(types);

  const toggleType = useCallback(
    (type: NodeType) => setKept((prev) => toggleInSet(prev, type)),
    [],
  );

  if (gateable.length === 0)
    return <RemoveButton variant={variant} split={false} onClick={() => onRemove(kept)} />;

  const controls = (
    <div className={cn('flex', variant === 'row' ? 'items-center gap-1' : 'items-stretch')}>
      <RemoveButton variant={variant} split={variant === 'bar'} onClick={() => onRemove(kept)} />
      <OptionsToggle
        variant={variant}
        open={open}
        controls={chipsId}
        onClick={() => {
          setKept(new Set());
          setOpen((v) => !v);
        }}
      />
    </div>
  );

  const chips = open && (
    <div id={chipsId} className="flex flex-wrap items-center gap-1.5">
      <span className={SECTION_LABEL}>{t('selection.alsoRemove')}</span>
      {gateable.map((type) => (
        <TypeChip
          key={type}
          type={type}
          active={!kept.has(type)}
          onToggle={() => toggleType(type)}
        />
      ))}
    </div>
  );

  return variant === 'row' ? (
    <div className="flex flex-col gap-2">
      {controls}
      {chips}
    </div>
  ) : (
    <div className="flex items-center gap-2">
      {chips}
      {controls}
    </div>
  );
};

export default RemoveTypeMenu;
