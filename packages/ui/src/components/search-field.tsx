import React from 'react';
import Input from './input';
import { t } from '../i18n';
import { cn } from '@shared/lib';
import SpicetifyIcon from './icon';
import { FOCUS_RING } from '../styles/surfaces';

type Props = Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> & {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
};

const SearchField = ({ value, onChange, onClear, placeholder, className, ...rest }: Props) => (
  <div className="relative">
    <span className="pointer-events-none absolute inset-y-0 start-2.5 flex items-center text-spice-subtext">
      <SpicetifyIcon icon="search" size={14} />
    </span>
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className={cn('px-8', className)}
      {...rest}
    />
    {value && (
      <button
        type="button"
        onClick={onClear ?? (() => onChange(''))}
        aria-label={t('filter.clear')}
        className={cn(
          'absolute inset-y-0 end-2 flex items-center rounded-md px-1 text-spice-subtext transition-colors hover:text-spice-text',
          FOCUS_RING,
        )}
      >
        <SpicetifyIcon icon="x" size={14} />
      </button>
    )}
  </div>
);

export default SearchField;
