import React from 'react';
import { t } from '../i18n';
import type { NodeType } from '../types';
import NodeTypeDot from './node-type-dot';
import { ToggleChip } from '@ui/components';
import { NODE_LEGEND_ORDER } from '../graph/node-style';

type Props = {
  visibleTypes: Set<NodeType>;
  onToggle: (type: NodeType) => void;
};

export const TypeChip = ({
  type,
  active,
  onToggle,
  count,
}: {
  type: NodeType;
  active: boolean;
  onToggle: () => void;
  count?: number;
}) => (
  <ToggleChip
    active={active}
    onToggle={onToggle}
    variant="outline"
    className="flex items-center gap-1.5"
  >
    <NodeTypeDot type={type} dim={!active} className="h-2 w-2" />
    {t(`type.${type}`)}
    {count !== undefined && <span className="tabular-nums text-spice-subtext/70">{count}</span>}
  </ToggleChip>
);

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
