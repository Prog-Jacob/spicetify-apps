import * as React from 'react';
import { cn } from '@shared/lib';
import SpicetifyIcon from './icon';

type Props = {
  icon: Spicetify.Icon;
  label: string;
  onClick: () => void;
  size?: number;
  disabled?: boolean;
  active?: boolean;
  className?: string;
};

const IconButton = ({ icon, label, onClick, size = 16, disabled, active, className }: Props) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={label}
    aria-label={label}
    aria-pressed={active}
    className={cn(
      'flex h-8 w-8 appearance-none items-center justify-center rounded-lg border border-transparent bg-transparent text-spice-subtext transition-colors',
      'hover:bg-spice-text/[0.1] hover:text-spice-text',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spice-button focus-visible:ring-offset-1 focus-visible:ring-offset-spice-card',
      'disabled:pointer-events-none disabled:opacity-40',
      active && 'bg-spice-button/20 text-spice-text',
      className,
    )}
  >
    <SpicetifyIcon icon={icon} size={size} />
  </button>
);

export default IconButton;
