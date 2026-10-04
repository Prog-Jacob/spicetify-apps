import React from 'react';
import { cn } from '@shared/lib';
import { FOCUS_RING } from '../styles/surfaces';

type ToggleChipProps = Omit<React.ComponentProps<'button'>, 'onClick'> & {
  active: boolean;
  onToggle: () => void;
  /** `accent` fills when on (primary options); `outline` stays quiet (filters). */
  variant?: 'accent' | 'outline';
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

export const ToggleChip = React.forwardRef<HTMLButtonElement, ToggleChipProps>(
  ({ active, onToggle, variant = 'accent', className, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60',
        FOCUS_RING,
        STYLE[variant][active ? 'on' : 'off'],
        className,
      )}
      {...rest}
    />
  ),
);
ToggleChip.displayName = 'ToggleChip';
