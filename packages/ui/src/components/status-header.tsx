import React from 'react';
import { cn } from '@shared/lib';
import TextComponent from './text';
import SpicetifyIcon from './icon';

export type StatusVariant = 'success' | 'warning' | 'error';

const VARIANT_STYLES: Record<
  StatusVariant,
  { icon: Spicetify.Icon; className: string; semanticColor?: string }
> = {
  success: { icon: 'check-alt-fill', className: 'bg-spice-button text-spice-main' },
  warning: {
    icon: 'exclamation-circle',
    className: 'text-spice-button',
  },
  error: {
    icon: 'x',
    className: 'bg-spice-notification-error/20 text-spice-notification-error',
    semanticColor: 'textNegative',
  },
};

type StatusHeaderProps = {
  variant: StatusVariant;
  title: string;
};

const StatusHeader = ({ variant, title }: StatusHeaderProps) => {
  const { icon, className, semanticColor } = VARIANT_STYLES[variant];
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={cn(
          'flex size-8 animate-scale-in items-center justify-center rounded-full',
          className,
        )}
      >
        <SpicetifyIcon icon={icon} size={18} />
      </div>
      <TextComponent variant="ballad" weight="bold" semanticColor={semanticColor}>
        {title}
      </TextComponent>
    </div>
  );
};

export default StatusHeader;
