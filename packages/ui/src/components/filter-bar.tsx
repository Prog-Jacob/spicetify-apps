import React from 'react';
import { t } from '../i18n';
import { cn } from '@shared/lib';
import TextComponent from './text';
import SearchField from './search-field';

type FilterBarProps = {
  value: string;
  total: number;
  filtered: number;
  onChange: (value: string) => void;
  className?: string;
};

const FilterBar = ({ value, total, filtered, onChange, className }: FilterBarProps) => (
  <div className={cn('flex items-center gap-3', className)}>
    <SearchField
      value={value}
      onChange={onChange}
      placeholder={t('filter.placeholder')}
      className="flex-1"
    />
    <TextComponent variant="minuet" semanticColor="textSubdued" className="shrink-0 tabular-nums">
      {t('filter.showing', { filtered, total })}
    </TextComponent>
  </div>
);

export default FilterBar;
