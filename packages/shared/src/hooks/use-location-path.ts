import { useSyncExternalStore } from 'react';

const subscribe = (onChange: () => void): (() => void) =>
  Spicetify.Platform.History.listen(onChange) ?? (() => {});

const read = (): string => Spicetify.Platform.History.location.pathname;

/** The client route, e.g. `/data-porter/import`. Call only once `useAppReady` is true. */
export const useLocationPath = (): string => useSyncExternalStore(subscribe, read);
