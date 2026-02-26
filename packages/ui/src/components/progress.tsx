import * as React from 'react';
import { cn } from '@shared/lib/utils';

type ProgressProps = React.ComponentProps<'div'> & {
  value?: number;
  indicatorClassName?: string;
};

function Progress({ className, indicatorClassName, value, ...props }: ProgressProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value ?? 0}
      aria-valuemin={0}
      aria-valuemax={100}
      data-slot="progress"
      className={cn('bg-spice-sidebar relative h-2 w-full overflow-hidden rounded-full', className)}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className={cn(
          'bg-spice-button absolute inset-y-0 start-0 transition-all',
          indicatorClassName,
        )}
        style={{ width: `${value || 0}%` }}
      />
    </div>
  );
}

export default Progress;
