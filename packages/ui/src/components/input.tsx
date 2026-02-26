import * as React from 'react';
import { cn } from '@shared/lib';

const Input = ({ className, ...props }: React.ComponentProps<'input'>) => (
  <input
    className={cn(
      'min-w-0 flex-1 rounded-md border border-spice-subtext/30 bg-spice-highlight/20 px-3 py-1.5 text-sm text-spice-text placeholder:text-spice-subtext/50 outline-none focus:border-spice-button/60 disabled:opacity-50',
      className,
    )}
    {...props}
  />
);

export default Input;
