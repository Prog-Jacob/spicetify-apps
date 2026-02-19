import React from 'react';
import { cn } from '@shared/lib/utils';
import DataTypeCard from './data-type-card';
import type { DataType } from '../types/export';
import { DATA_TYPES, toggleInSet } from '../data-types';

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
    {DATA_TYPES.map(({ type, label, description, icon }) => {
      const count = counts?.get(type);
      if (counts && count === undefined) return null;
      return (
        <DataTypeCard
          key={type}
          icon={icon}
          label={label}
          description={description}
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
