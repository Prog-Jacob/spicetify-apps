import { cn } from '@shared/lib';
import { FOCUS_RING } from '../styles/surfaces';
import { resolveNativeComponent } from '../lib/resolve-native-component';
import React, { forwardRef, type ComponentProps, type ComponentType } from 'react';

export type ButtonProps = ComponentProps<'button'> & {
  buttonSize?: 'sm' | 'md' | 'lg';
  iconLeading?: () => React.ReactNode;
  iconTrailing?: () => React.ReactNode;
};

type Variant = 'primary' | 'secondary' | 'tertiary';

const SIZES = { sm: 'px-3 py-1 text-xs', md: 'px-4 py-1.5 text-sm', lg: 'px-6 py-2 text-base' };
const BASE = cn(
  'inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50',
  FOCUS_RING,
);
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-spice-button text-spice-main hover:opacity-90',
  secondary:
    'border border-spice-subtext/40 bg-transparent text-spice-text hover:bg-spice-highlight/20',
  tertiary: 'border border-transparent bg-transparent text-spice-text hover:bg-spice-highlight/20',
};

const makeFallback = (variant: Variant): ComponentType<ButtonProps> => {
  const Fallback = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ buttonSize = 'md', className, iconLeading, iconTrailing, children, ...rest }, ref) => (
      <button
        ref={ref}
        type="button"
        className={cn(BASE, SIZES[buttonSize], VARIANTS[variant], className)}
        {...rest}
      >
        {iconLeading?.()}
        {children}
        {iconTrailing?.()}
      </button>
    ),
  );
  Fallback.displayName = `Button-${variant}`;
  return Fallback as ComponentType<ButtonProps>;
};

/** Spotify's own buttons when available (they track the theme exactly), with matching fallbacks. */
export const ButtonPrimary = resolveNativeComponent<ButtonProps>(
  'ButtonPrimary',
  makeFallback('primary'),
);
export const ButtonSecondary = resolveNativeComponent<ButtonProps>(
  'ButtonSecondary',
  makeFallback('secondary'),
);
export const ButtonTertiary = resolveNativeComponent<ButtonProps>(
  'ButtonTertiary',
  makeFallback('tertiary'),
);
