import { useRef, useLayoutEffect, type MutableRefObject } from 'react';

/**
 * A ref that always holds the latest `value`, for callbacks registered once (listeners, long-lived
 * instances). Written in a layout effect: a render React discards must not publish its props.
 */
export const useLatestRef = <T>(value: T): Readonly<MutableRefObject<T>> => {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
};
