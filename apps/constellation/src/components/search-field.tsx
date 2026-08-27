import React from 'react';
import { t } from '../i18n';
import { cn } from '@shared/lib';
import { Input, SpicetifyIcon } from '@ui/components';

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
        aria-label={t('controls.clearSearch')}
        className="absolute inset-y-0 end-2 flex items-center text-spice-subtext transition-colors hover:text-spice-text focus-visible:text-spice-text focus-visible:outline-none"
      >
        <SpicetifyIcon icon="x" size={14} />
      </button>
    )}
  </div>
);

export default SearchField;
