import { t } from '../i18n';
import { TypeChip } from './type-filter';
import { toggleInSet } from '@shared/lib';
import { SECTION_LABEL } from '@ui/styles';
import type { NodeType } from '../types/graph';
import { NODE_LEGEND_ORDER } from '../graph/node-style';
import React, { useId, useState, useCallback } from 'react';
import { ActionButton, SpicetifyIcon, ButtonSecondary } from '@ui/components';

type Props = {
  types: NodeType[];
  onRemove: (keep: Set<NodeType>) => void;
};

const useRemoveOptions = (types: NodeType[]) => {
  const chipsId = useId();
  const [open, setOpen] = useState(false);
  const [kept, setKept] = useState<Set<NodeType>>(() => new Set());
  const toggleOpen = useCallback(() => {
    setKept(new Set());
    setOpen((v) => !v);
  }, []);
  const toggleKept = useCallback(
    (type: NodeType) => setKept((prev) => toggleInSet(prev, type)),
    [],
  );
  const gateable = NODE_LEGEND_ORDER.filter((type) => types.includes(type));
  return { chipsId, open, kept, gateable, toggleOpen, toggleKept };
};

type Options = ReturnType<typeof useRemoveOptions>;

const KeepChips = ({ chipsId, gateable, kept, toggleKept }: Options) => (
  <div id={chipsId} className="flex flex-wrap items-center gap-1.5">
    <span className={SECTION_LABEL}>{t('selection.alsoRemove')}</span>
    {gateable.map((type) => (
      <TypeChip key={type} type={type} active={!kept.has(type)} onToggle={() => toggleKept(type)} />
    ))}
  </div>
);

const toggleProps = ({ open, chipsId, toggleOpen }: Options) => ({
  'aria-label': t('selection.removeOptions'),
  'aria-expanded': open,
  'aria-controls': chipsId,
  onClick: toggleOpen,
});

const Chevron = ({ open }: { open: boolean }) => (
  <SpicetifyIcon icon="chevron-right" size={11} className={open ? '-rotate-90' : 'rotate-90'} />
);

export const RemoveSplitButton = ({ types, onRemove }: Props) => {
  const options = useRemoveOptions(types);
  const remove = (className?: string) => (
    <ActionButton icon="minus" onClick={() => onRemove(options.kept)} className={className}>
      {t('selection.remove')}
    </ActionButton>
  );
  if (!options.gateable.length) return remove();

  return (
    <div className="flex items-center gap-2">
      {options.open && <KeepChips {...options} />}
      <div className="flex items-stretch">
        {remove('rounded-e-none')}
        <ActionButton {...toggleProps(options)} className="rounded-s-none border-s-0 px-1.5">
          <Chevron open={options.open} />
        </ActionButton>
      </div>
    </div>
  );
};

export const RemoveMenu = ({ types, onRemove }: Props) => {
  const options = useRemoveOptions(types);
  const remove = (
    <ButtonSecondary
      buttonSize="sm"
      iconLeading={() => <SpicetifyIcon icon="minus" size={14} />}
      onClick={() => onRemove(options.kept)}
    >
      {t('inspector.remove')}
    </ButtonSecondary>
  );
  if (!options.gateable.length) return remove;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        {remove}
        <ButtonSecondary buttonSize="sm" {...toggleProps(options)}>
          <Chevron open={options.open} />
        </ButtonSecondary>
      </div>
      {options.open && <KeepChips {...options} />}
    </div>
  );
};
