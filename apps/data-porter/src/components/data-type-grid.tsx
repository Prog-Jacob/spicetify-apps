import React from 'react';
import { t } from '../i18n';
import DataTypeCard from './data-type-card';
import { cn, toggleInSet } from '@shared/lib';
import type { DataType } from '../types/export';
import { IMPORTABLE_DATA_TYPES, type DataTypeConfig } from '../data-types';

type DataTypeGridProps = {
  selected: Set<DataType>;
  onToggle: (next: Set<DataType>) => void;
  disabled?: boolean;
  counts?: Map<DataType, number>;
  dataTypes?: DataTypeConfig[];
  onPreview?: (type: DataType) => void;
};

const DataTypeGrid = ({
  selected,
  onToggle,
  disabled,
  counts,
  dataTypes = IMPORTABLE_DATA_TYPES,
  onPreview,
}: DataTypeGridProps) => (
  <div
    className={cn(
      'grid gap-3 transition-opacity duration-300 [grid-template-columns:repeat(auto-fit,minmax(220px,max-content))] max-w-[940px]',
      disabled && 'pointer-events-none opacity-50',
    )}
  >
    {dataTypes.map(({ type, labelKey, descKey, icon, exportOnly }) => {
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
          onPreview={onPreview && count ? () => onPreview(type) : undefined}
          count={count}
          badge={exportOnly ? t('dataType.exportOnly') : undefined}
        />
      );
    })}
  </div>
);

export default DataTypeGrid;
