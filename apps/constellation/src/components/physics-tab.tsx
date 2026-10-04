import { t } from '../i18n';
import React, { memo } from 'react';
import { PHYSICS, type PhysicsParams } from '../graph/force-config';
import { ToggleChip, SpicetifyIcon, Slider, ActionButton } from '@ui/components';

const FORMAT: Record<keyof PhysicsParams, (value: number) => string> = {
  repulsion: (v) => t.number(Math.round(v)),
  linkLength: (v) => t('physics.linkLengthValue', { value: v }),
  gravity: (v) => t.number(v),
  spacing: (v) => t('physics.spacingValue', { value: Math.round(v) }),
};

const KNOBS = Object.keys(FORMAT) as (keyof PhysicsParams)[];

type Props = {
  params: PhysicsParams;
  frozen: boolean;
  isDefault: boolean;
  onChange: (key: keyof PhysicsParams, value: number) => void;
  onToggleFrozen: () => void;
  onReset: () => void;
};

const PhysicsTab = ({ params, frozen, isDefault, onChange, onToggleFrozen, onReset }: Props) => (
  <div className="flex flex-col gap-3.5">
    {KNOBS.map((key) => (
      <Slider
        key={key}
        label={t(`physics.${key}`)}
        value={params[key]}
        min={PHYSICS[key].min}
        max={PHYSICS[key].max}
        step={PHYSICS[key].step}
        valueLabel={FORMAT[key](params[key])}
        onChange={(value) => onChange(key, value)}
      />
    ))}

    <div className="flex items-center justify-between gap-2 pt-0.5">
      <ToggleChip active={frozen} onToggle={onToggleFrozen} variant="outline">
        <SpicetifyIcon icon="pause" size={11} />
        {t('physics.freeze')}
      </ToggleChip>
      <ActionButton icon="repeat" onClick={onReset} disabled={isDefault}>
        {t('physics.reset')}
      </ActionButton>
    </div>
  </div>
);

export default memo(PhysicsTab);
