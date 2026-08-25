import React from 'react';
import { cn } from '@shared/lib';

type Props = {
  active: boolean;
  onToggle: () => void;
  className?: string;
  children: React.ReactNode;
};

const ToggleChip = ({ active, onToggle, className, children }: Props) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onToggle}
    className={cn(
      'rounded-full border px-2 py-1 text-xs transition-colors',
      active
        ? 'border-spice-button/60 bg-spice-button/20 text-spice-text'
        : 'border-spice-subtext/30 bg-spice-card/60 text-spice-subtext hover:border-spice-subtext/50 hover:text-spice-text',
      className,
    )}
  >
    {children}
  </button>
);

export default ToggleChip;
