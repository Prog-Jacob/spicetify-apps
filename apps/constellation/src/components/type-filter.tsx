import React from 'react';
import { t } from '../i18n';
import ToggleChip from './toggle-chip';
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
  <ToggleChip active={active} onToggle={onToggle} className="flex items-center gap-1.5">
    <NodeTypeDot type={type} dim={!active} className="h-2 w-2" />
    {t(`type.${type}`)}
  </ToggleChip>
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
