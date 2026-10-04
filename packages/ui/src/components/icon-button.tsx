import * as React from 'react';
import { cn } from '@shared/lib';
import { FOCUS_RING } from '../styles/surfaces';
import { SpicetifyIcon } from './spicetify-icon';

type IconButtonProps = Omit<React.ComponentProps<'button'>, 'children'> & {
  icon: Spicetify.Icon;
  /** Accessible name and tooltip; an icon-only button has no other. */
  label: string;
  size?: number;
  active?: boolean;
  shape?: 'square' | 'round';
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, size = 16, active, shape = 'square', className, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'flex size-8 shrink-0 items-center justify-center border border-transparent bg-transparent text-spice-subtext transition-colors',
        shape === 'round' ? 'rounded-full' : 'rounded-lg',
        'hover:bg-spice-text/[0.1] hover:text-spice-text disabled:pointer-events-none disabled:opacity-40',
        FOCUS_RING,
        active && 'bg-spice-button/20 text-spice-text',
        className,
      )}
      {...rest}
    >
      <SpicetifyIcon icon={icon} size={size} />
    </button>
  ),
);
IconButton.displayName = 'IconButton';
