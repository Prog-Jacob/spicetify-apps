import React from 'react';
import { cn } from '@shared/lib';

type Props = {
  orientation?: 'vertical' | 'horizontal';
  className?: string;
};

const Divider = ({ orientation = 'vertical', className }: Props) => (
  <span
    aria-hidden
    className={cn(
      'shrink-0 bg-spice-subtext/20',
      orientation === 'vertical' ? 'h-4 w-px' : 'h-px w-full',
      className,
    )}
  />
);

export default Divider;
