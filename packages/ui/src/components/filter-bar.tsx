import React from 'react';
import { t } from '../i18n';
import Input from './input';
import { cn } from '@shared/lib';
import TextComponent from './text';

type FilterBarProps = {
  value: string;
  total: number;
  filtered: number;
  onChange: (value: string) => void;
  className?: string;
};

const FilterBar = ({ value, total, filtered, onChange, className }: FilterBarProps) => (
  <div className={cn('flex items-center gap-3', className)}>
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={t('filter.placeholder')}
      aria-label={t('filter.placeholder')}
    />
    <TextComponent variant="minuet" semanticColor="textSubdued" className="shrink-0 tabular-nums">
      {t('filter.showing', { filtered, total })}
    </TextComponent>
  </div>
);

export default FilterBar;
