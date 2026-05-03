import * as React from 'react';
import { cn } from '@shared/lib';

const Card = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="card"
    className={cn(
      'bg-spice-card text-spice-text flex flex-col gap-6 rounded-xl border border-spice-shadow/10 py-6 shadow-sm',
      className,
    )}
    {...props}
  />
);

const CardContent = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div data-slot="card-content" className={cn('px-6', className)} {...props} />
);

export { Card, CardContent };
