import React, { forwardRef, type ComponentType } from 'react';

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
