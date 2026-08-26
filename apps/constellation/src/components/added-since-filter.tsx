import React from 'react';
import { t } from '../i18n';
import { toDateString } from '@shared/lib';
import { FOCUS_RING } from './chrome-styles';
import { SpicetifyIcon } from '@ui/components';

type Props = { min: number; max: number; since: number; onChange: (value: number) => void };

const DAY_MS = 86_400_000;

const AddedSinceFilter = ({ min, max, since, onChange }: Props) => (
  <label className="flex flex-col gap-1.5 text-xs text-spice-subtext">
    <span className="flex items-center justify-between gap-2">
      <span className="font-medium text-spice-text">
        {since <= min ? t('time.all') : t('time.since', { date: toDateString(since) })}
      </span>
      {since > min && (
        <button
          type="button"
          onClick={() => onChange(min)}
          aria-label={t('time.reset')}
          className={`flex h-4 w-4 items-center justify-center rounded text-spice-subtext transition-colors hover:text-spice-text ${FOCUS_RING}`}
        >
          <SpicetifyIcon icon="x" size={10} />
        </button>
      )}
    </span>
    <input
      type="range"
      min={min}
      max={max}
      step={DAY_MS}
      value={since}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={t('time.label')}
      className="h-1 w-full cursor-pointer appearance-none rounded-full bg-spice-subtext/25 accent-spice-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spice-button focus-visible:ring-offset-2 focus-visible:ring-offset-spice-card"
    />
    <div className="flex justify-between text-[10px] tabular-nums text-spice-subtext/60">
      <span>{toDateString(min)}</span>
      <span>{toDateString(max)}</span>
    </div>
  </label>
);

export default AddedSinceFilter;
