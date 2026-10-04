import * as React from 'react';
import { cn } from '@shared/lib';

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'min-w-0 flex-1 rounded-md border border-spice-subtext/30 bg-spice-highlight/20 px-3 py-1.5 text-sm text-spice-text outline-none placeholder:text-spice-subtext/70',
        'focus-visible:border-spice-button focus-visible:ring-1 focus-visible:ring-spice-button disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
