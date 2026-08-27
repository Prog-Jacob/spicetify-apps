import React from 'react';
import { cn } from '@shared/lib';

type Props = {
  active: boolean;
  onToggle: () => void;
  variant?: 'accent' | 'outline';
  className?: string;
  children: React.ReactNode;
};

const STYLE = {
  accent: {
    on: 'border-spice-button bg-spice-button text-spice-main',
    off: 'border-spice-subtext/40 bg-transparent text-spice-text hover:border-spice-text/60 hover:bg-spice-text/[0.08]',
  },
  outline: {
    on: 'border-spice-text/55 bg-transparent text-spice-text hover:bg-spice-text/[0.08]',
    off: 'border-spice-subtext/25 bg-transparent text-spice-subtext hover:text-spice-text hover:border-spice-subtext/40',
  },
} as const;

const ToggleChip = ({ active, onToggle, variant = 'accent', className, children }: Props) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onToggle}
    className={cn(
      'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spice-button',
      STYLE[variant][active ? 'on' : 'off'],
      className,
    )}
  >
    {children}
  </button>
);

export default ToggleChip;
