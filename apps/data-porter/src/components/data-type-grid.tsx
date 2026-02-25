import React from 'react';
import { t } from '../i18n';
import { DATA_TYPES } from '../data-types';
import DataTypeCard from './data-type-card';
import type { DataType } from '../types/export';
import { cn, toggleInSet } from '@shared/lib/utils';

type DataTypeGridProps = {
  selected: Set<DataType>;
  onToggle: (next: Set<DataType>) => void;
  disabled?: boolean;
  counts?: Map<DataType, number>;
};

const DataTypeGrid = ({ selected, onToggle, disabled, counts }: DataTypeGridProps) => (
  <div
    className={cn(
      'grid gap-3 transition-opacity duration-300 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]',
      disabled && 'pointer-events-none opacity-50',
    )}
  >
    {DATA_TYPES.map(({ type, labelKey, descKey, icon }) => {
      const count = counts?.get(type);
      if (counts && count === undefined) return null;
      return (
        <DataTypeCard
          key={type}
          icon={icon}
          label={t(labelKey)}
          description={t(descKey)}
          selected={selected.has(type)}
          disabled={disabled}
          onToggle={() => onToggle(toggleInSet(selected, type))}
          count={count}
        />
      );
    })}
  </div>
);

export default DataTypeGrid;
