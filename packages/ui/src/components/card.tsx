import * as React from 'react';
import { cn } from '@shared/lib/utils';

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        'bg-spice-card text-spice-text flex flex-col gap-6 rounded-xl border border-spice-shadow/10 py-6 shadow-sm',
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('px-6', className)} {...props} />;
}

export { Card, CardContent };
