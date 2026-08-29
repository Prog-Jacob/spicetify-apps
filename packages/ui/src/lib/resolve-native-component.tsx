import React, { forwardRef, type ComponentType } from 'react';

/**
 * Prefers Spotify's own component, falling back to ours. Resolution happens per render, not at
 * module load, because `Spicetify.ReactComponent` is populated after the bundle is evaluated.
 */
export const resolveNativeComponent = <P extends object>(
  name: keyof typeof Spicetify.ReactComponent,
  Fallback: ComponentType<P>,
): ComponentType<P> => {
  const Component = forwardRef<unknown, P>((props, ref) => {
    const native = Spicetify.ReactComponent?.[name] as ComponentType<P> | undefined;
    const Resolved = typeof native === 'object' && native ? native : Fallback;
    return React.createElement(Resolved, { ...props, ref } as P);
  });
  Component.displayName = String(name);
  return Component as unknown as ComponentType<P>;
};
