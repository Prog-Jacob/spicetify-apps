import React from 'react';
import { t } from '../i18n';
import { toDateString } from '@shared/lib';
import { IconButton, Slider } from '@ui/components';

type Props = { min: number; max: number; since: number; onChange: (value: number) => void };

const DAY_MS = 86_400_000;

const AddedSinceFilter = ({ min, max, since, onChange }: Props) => (
  <div className="flex flex-col gap-1.5 text-xs text-spice-subtext">
    <span className="flex items-center justify-between gap-2">
      <span className="font-medium text-spice-text">
        {since <= min ? t('time.all') : t('time.since', { date: toDateString(since) })}
      </span>
      {since > min && (
        <IconButton
          icon="x"
          label={t('time.reset')}
          onClick={() => onChange(min)}
          size={11}
          className="h-6 w-6"
        />
      )}
    </span>
    <Slider
      min={min}
      max={max}
      step={DAY_MS}
      value={since}
      onChange={onChange}
      ariaLabel={t('time.label')}
    />
    <div className="flex justify-between text-[10px] tabular-nums text-spice-subtext/60">
      <span>{toDateString(min)}</span>
      <span>{toDateString(max)}</span>
    </div>
  </div>
);

export default AddedSinceFilter;
