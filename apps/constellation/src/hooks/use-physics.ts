import { useState, useCallback } from 'react';
import { usePersistentState, type Codec } from './use-persistent-state';
import { PHYSICS, PHYSICS_DEFAULTS, type PhysicsParams } from '../graph/force-config';

const clamp = (key: keyof PhysicsParams, value: number): number => {
  const { min, max } = PHYSICS[key];
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : PHYSICS_DEFAULTS[key];
};

const physicsCodec: Codec<PhysicsParams> = {
  parse: (raw) => {
    const stored = JSON.parse(raw) as Partial<Record<keyof PhysicsParams, number>>;
    const next = { ...PHYSICS_DEFAULTS };
    for (const key of Object.keys(PHYSICS_DEFAULTS) as (keyof PhysicsParams)[]) {
      if (typeof stored[key] === 'number') next[key] = clamp(key, stored[key]);
    }
    return next;
  },
  serialize: JSON.stringify,
};

export const usePhysics = () => {
  const [physics, setPhysics] = usePersistentState('physics', PHYSICS_DEFAULTS, physicsCodec);
  const [frozen, setFrozen] = useState(false);

  const setParam = useCallback(
    (key: keyof PhysicsParams, value: number) =>
      setPhysics((prev) => ({ ...prev, [key]: clamp(key, value) })),
    [setPhysics],
  );
  const reset = useCallback(() => setPhysics(PHYSICS_DEFAULTS), [setPhysics]);
  const toggleFrozen = useCallback(() => setFrozen((f) => !f), [setFrozen]);

  const isDefault = (Object.keys(PHYSICS_DEFAULTS) as (keyof PhysicsParams)[]).every(
    (key) => physics[key] === PHYSICS_DEFAULTS[key],
  );

  return { physics, setParam, reset, isDefault, frozen, toggleFrozen };
};
