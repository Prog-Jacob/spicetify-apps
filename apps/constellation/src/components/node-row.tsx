import React from 'react';
import { t } from '../i18n';
import { cn } from '@shared/lib';
import NodeTypeDot from './node-type-dot';
import type { NodeType } from '../types/graph';
import { FOCUS_RING_INSET, REVEAL_ON_HOVER } from '@ui/styles';

export const NodeRowContent = ({
  type,
  label,
  revealTag,
}: {
  type: NodeType;
  label: string;
  revealTag?: boolean;
}) => (
  <>
    <NodeTypeDot type={type} />
    <span className="truncate text-sm text-spice-text">{label}</span>
    <span
      className={cn(
        'ms-auto shrink-0 text-[11px] font-medium text-spice-subtext/70',
        revealTag && cn('transition-opacity', REVEAL_ON_HOVER),
      )}
    >
      {t(`type.${type}`)}
    </span>
  </>
);

const NodeRow = ({
  type,
  label,
  onSelect,
  revealTag,
  trailing,
}: {
  type: NodeType;
  label: string;
  onSelect?: () => void;
  revealTag?: boolean;
  trailing?: React.ReactNode;
}) => (
  <li className="group flex items-center gap-2.5 rounded-lg pe-1 ps-2.5 [contain-intrinsic-size:auto_40px] [content-visibility:auto] hover:bg-spice-text/[0.06]">
    {onSelect ? (
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-2.5 border-0 bg-transparent py-2 text-start',
          FOCUS_RING_INSET,
        )}
      >
        <NodeRowContent type={type} label={label} revealTag={revealTag} />
      </button>
    ) : (
      <div className="flex min-w-0 flex-1 items-center gap-2.5 py-2">
        <NodeRowContent type={type} label={label} revealTag={revealTag} />
      </div>
    )}
    {trailing}
  </li>
);

export default NodeRow;
