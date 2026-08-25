import React from 'react';
import { t } from '../i18n';
import { cn } from '@shared/lib';
import type { NodeType } from '../types';
import NodeTypeDot from './node-type-dot';
import { NODE_LEGEND_ORDER } from '../graph/node-style';

type Props = {
  visibleTypes: Set<NodeType>;
  onToggle: (type: NodeType) => void;
};

const TypeChip = ({
  type,
  active,
  onToggle,
}: {
  type: NodeType;
  active: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onToggle}
    className={cn(
      'flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition-colors',
      active
        ? 'border-spice-button/40 bg-spice-highlight/20 text-spice-text'
        : 'border-transparent bg-spice-highlight/5 text-spice-subtext/60',
    )}
  >
    <NodeTypeDot type={type} dim={!active} className="h-2 w-2" />
    {t(`type.${type}`)}
  </button>
);

// Doubles as the color legend: each chip's dot is the node color, and toggling it filters that
// type off the canvas.
const TypeFilter = ({ visibleTypes, onToggle }: Props) => (
  <div className="flex flex-wrap gap-1.5">
    {NODE_LEGEND_ORDER.map((type) => (
      <TypeChip
        key={type}
        type={type}
        active={visibleTypes.has(type)}
        onToggle={() => onToggle(type)}
      />
    ))}
  </div>
);

export default TypeFilter;
