import React from 'react';
import { cn } from '@shared/lib';

type DividerProps = {
  orientation?: 'vertical' | 'horizontal';
  className?: string;
};

export const Divider = ({ orientation = 'vertical', className }: DividerProps) => (
  <span
    aria-hidden
    className={cn(
      'shrink-0 bg-spice-subtext/20',
      orientation === 'vertical' ? 'h-4 w-px' : 'h-px w-full',
      className,
    )}
  />
);
