import React from 'react';
import { t } from '../i18n';
import { cn } from '@shared/lib';
import { SearchField } from './search-field';
import { TextComponent } from './text-component';

type FilterBarProps = {
  value: string;
  total: number;
  filtered: number;
  onChange: (value: string) => void;
  className?: string;
};

export const FilterBar = ({ value, total, filtered, onChange, className }: FilterBarProps) => (
  <div className={cn('flex items-center gap-3', className)}>
    <SearchField
      value={value}
      onChange={onChange}
      placeholder={t('filter.placeholder')}
      className="flex-1"
    />
    <TextComponent
      variant="minuet"
      semanticColor="textSubdued"
      className="shrink-0 tabular-nums"
      aria-live="polite"
    >
      {t('filter.showing', { filtered, total })}
    </TextComponent>
  </div>
);
