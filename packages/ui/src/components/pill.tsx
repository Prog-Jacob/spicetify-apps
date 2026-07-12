import React from 'react';
import { cn } from '@shared/lib';

const VARIANT_STYLES = {
  neutral: 'border border-spice-subtext/20 bg-spice-subtext/10',
  error: 'bg-spice-notification-error/15 text-spice-notification-error',
} as const;

type PillProps = {
  variant?: keyof typeof VARIANT_STYLES;
  className?: string;
  children: React.ReactNode;
};

const Pill = ({ variant = 'neutral', className, children }: PillProps) => (
  <span className={cn('rounded-full px-2 py-0.5 text-[10px]', VARIANT_STYLES[variant], className)}>
    {children}
  </span>
);

export default Pill;
