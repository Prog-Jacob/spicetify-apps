import { cn } from '@shared/lib';
import React, { forwardRef } from 'react';
import { FOCUS_RING } from '../styles/surfaces';
import { SpicetifyIcon } from './spicetify-icon';

type ActionButtonProps = React.ComponentProps<'button'> & { icon?: Spicetify.Icon };

export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ icon, className, children, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-spice-subtext/25 bg-transparent px-2.5 py-1.5 text-[11px] font-semibold text-spice-subtext transition-colors',
        'hover:border-spice-subtext/45 hover:bg-spice-text/[0.06] hover:text-spice-text disabled:pointer-events-none disabled:opacity-40',
        FOCUS_RING,
        className,
      )}
      {...rest}
    >
      {icon && <SpicetifyIcon icon={icon} size={11} />}
      {children}
    </button>
  ),
);
ActionButton.displayName = 'ActionButton';
