import React from 'react';
import { t } from '../i18n';
import { cn } from '@shared/lib';
import type { NodeType } from '../types';
import NodeTypeDot from './node-type-dot';
import { SpicetifyIcon } from '@ui/components';
import { FOCUS_RING, FOCUS_RING_INSET } from './chrome-styles';

export const RowAction = ({
  icon,
  label,
  onClick,
}: {
  icon: Spicetify.Icon;
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className={cn(
      'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-transparent bg-transparent text-spice-subtext transition-colors',
      'opacity-0 hover:bg-spice-text/10 hover:text-spice-text group-hover:opacity-100 focus-visible:opacity-100',
      FOCUS_RING,
    )}
  >
    <SpicetifyIcon icon={icon} size={13} />
  </button>
);

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
        'ms-auto shrink-0 text-[10px] font-medium uppercase tracking-wider text-spice-subtext/60',
        revealTag && 'opacity-0 transition-opacity group-hover:opacity-100',
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
