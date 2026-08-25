import React from 'react';
import { t } from '../i18n';
import { toDateString } from '@shared/lib';

type Props = { min: number; max: number; since: number; onChange: (value: number) => void };

const DAY_MS = 86_400_000;

const AddedSinceFilter = ({ min, max, since, onChange }: Props) => (
  <label className="flex flex-col gap-1.5 text-xs text-spice-subtext">
    <span className="font-medium text-spice-text">
      {since <= min ? t('time.all') : t('time.since', { date: toDateString(since) })}
    </span>
    <input
      type="range"
      min={min}
      max={max}
      step={DAY_MS}
      value={since}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={t('time.label')}
      className="h-1 w-full cursor-pointer appearance-none rounded-full bg-spice-subtext/25 accent-spice-button"
    />
  </label>
);

export default AddedSinceFilter;
