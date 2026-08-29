import React from 'react';
import { t } from '../i18n';
import { ACTION_BUTTON } from '../styles/chrome';
import type { usePhysics } from '../hooks/use-physics';
import { ToggleChip, SpicetifyIcon, Slider } from '@ui/components';
import { PHYSICS, type PhysicsParams } from '../graph/force-config';

const FORMAT: Record<keyof PhysicsParams, (value: number) => string> = {
  repulsion: (v) => String(Math.round(v)),
  linkLength: (v) => `${v.toFixed(2)}×`,
  gravity: (v) => v.toFixed(3),
  spacing: (v) => `${Math.round(v)} px`,
};

const KNOBS = Object.keys(FORMAT) as (keyof PhysicsParams)[];

const PhysicsTab = ({ physics }: { physics: ReturnType<typeof usePhysics> }) => (
  <div className="flex flex-col gap-3.5">
    {KNOBS.map((key) => (
      <Slider
        key={key}
        label={t(`physics.${key}`)}
        value={physics.params[key]}
        min={PHYSICS[key].min}
        max={PHYSICS[key].max}
        step={PHYSICS[key].step}
        valueLabel={FORMAT[key](physics.params[key])}
        onChange={(value) => physics.setParam(key, value)}
      />
    ))}

    <div className="flex items-center justify-between gap-2 pt-0.5">
      <ToggleChip active={physics.frozen} onToggle={physics.toggleFrozen} variant="outline">
        <span className="flex items-center gap-1.5">
          <SpicetifyIcon icon="pause" size={11} />
          {t('physics.freeze')}
        </span>
      </ToggleChip>
      <button
        type="button"
        onClick={physics.reset}
        disabled={physics.isDefault}
        className={ACTION_BUTTON}
      >
        <SpicetifyIcon icon="repeat" size={11} />
        {t('physics.reset')}
      </button>
    </div>
  </div>
);

export default PhysicsTab;
