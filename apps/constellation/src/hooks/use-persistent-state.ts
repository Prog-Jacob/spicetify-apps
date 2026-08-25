import { usePersistentState as useStored, type Codec } from '@shared/hooks';

export type { Codec };

export const usePersistentState = <T>(key: string, initial: T, codec?: Codec<T>) =>
  useStored(`constellation:${key}`, initial, codec);
