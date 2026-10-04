import React from 'react';
import { t } from '../i18n';
import { Input } from './input';
import { cn } from '@shared/lib';
import { FOCUS_RING } from '../styles/surfaces';
import { SpicetifyIcon } from './spicetify-icon';

type SearchFieldProps = Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> & {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
};

export const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(
  ({ value, onChange, onClear, placeholder, className, ...rest }, ref) => (
    <div className={cn('relative flex min-w-0', className)}>
      <span className="pointer-events-none absolute inset-y-0 start-2.5 flex items-center text-spice-subtext">
        <SpicetifyIcon icon="search" size={14} />
      </span>
      <Input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="px-8"
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
  ),
);
SearchField.displayName = 'SearchField';
