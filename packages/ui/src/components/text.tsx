import React, { forwardRef, type CSSProperties, type ComponentProps } from 'react';

const toVar = (sc: string) => `var(--${sc.replace(/([A-Z])/g, '-$1').toLowerCase()})`;
const WEIGHTS = { book: 400, bold: 700, black: 900 } as const;
const VARIANTS = {
  canon: { fontSize: 20, lineHeight: '24px', letterSpacing: '-0.2px', fontWeight: 700 },
  alto: { fontSize: 24, lineHeight: '28px', letterSpacing: '-0.24px', fontWeight: 700 },
  ballad: { fontSize: 16, lineHeight: '24px', fontWeight: 400 },
  viola: { fontSize: 14, lineHeight: '20px', fontWeight: 400 },
  mesto: { fontSize: 12, lineHeight: '16px', letterSpacing: '0.1px', fontWeight: 400 },
  minuet: { fontSize: 11, lineHeight: '16px', letterSpacing: '0.2px', fontWeight: 400 },
} as const satisfies Record<string, CSSProperties>;

type TextProps = ComponentProps<'span'> & {
  variant?: keyof typeof VARIANTS;
  weight?: keyof typeof WEIGHTS;
  semanticColor?: string;
};

const FallbackText = forwardRef<React.ElementRef<'span'>, TextProps>(
  ({ variant = 'viola', weight, semanticColor, style, className, ...rest }, ref) => (
    <span
      ref={ref}
      className={className}
      style={{
        ...VARIANTS[variant],
        ...(weight && { fontWeight: WEIGHTS[weight] }),
        ...(semanticColor && { color: toVar(semanticColor) }),
        ...style,
      }}
      {...rest}
    />
  ),
);
FallbackText.displayName = 'TextComponent';

// Broken ones are Proxy(Function) wrappers (typeof 'function').
// Working Spicetify components are forwardRef objects (typeof 'object').
const Native = Spicetify.ReactComponent?.TextComponent;
const TextComponent = typeof Native === 'object' && Native ? Native : FallbackText;

export default TextComponent;
