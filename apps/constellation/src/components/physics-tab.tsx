import React from 'react';
import { t } from '../i18n';
import { ACTION_BUTTON } from './chrome-styles';
import type { usePhysics } from '../hooks/use-physics';
import { ToggleChip, SpicetifyIcon, Slider } from '@ui/components';
import { PHYSICS, type PhysicsParams } from '../graph/force-config';

type Knob = { key: keyof PhysicsParams; label: string; format: (value: number) => string };

const KNOBS: Knob[] = [
  { key: 'repulsion', label: t('physics.repulsion'), format: (v) => String(Math.round(v)) },
  { key: 'linkLength', label: t('physics.linkLength'), format: (v) => `${v.toFixed(2)}×` },
  { key: 'gravity', label: t('physics.gravity'), format: (v) => v.toFixed(3) },
  { key: 'spacing', label: t('physics.spacing'), format: (v) => `${Math.round(v)} px` },
];

const PhysicsTab = ({ physics }: { physics: ReturnType<typeof usePhysics> }) => (
  <div className="flex flex-col gap-3.5">
    {KNOBS.map(({ key, label, format }) => (
      <Slider
        key={key}
        label={label}
        value={physics.physics[key]}
        min={PHYSICS[key].min}
        max={PHYSICS[key].max}
        step={PHYSICS[key].step}
        valueLabel={format(physics.physics[key])}
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
