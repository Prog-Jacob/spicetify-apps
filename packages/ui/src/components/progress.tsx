import * as React from 'react';
import { cn } from '@shared/lib';

type ProgressProps = React.ComponentProps<'div'> & {
  /** 0–100; omit while the total is unknown to render an indeterminate bar. */
  value?: number;
  indicatorClassName?: string;
};

export const Progress = ({ className, indicatorClassName, value, ...props }: ProgressProps) => (
  <div
    role="progressbar"
    aria-valuenow={value}
    aria-valuemin={0}
    aria-valuemax={100}
    data-slot="progress"
    className={cn('bg-spice-sidebar relative h-2 w-full overflow-hidden rounded-full', className)}
    {...props}
  >
    <div
      data-slot="progress-indicator"
      className={cn(
        'bg-spice-button absolute inset-y-0 start-0 transition-[width]',
        indicatorClassName,
      )}
      style={{ width: `${value ?? 100}%` }}
    />
  </div>
);
