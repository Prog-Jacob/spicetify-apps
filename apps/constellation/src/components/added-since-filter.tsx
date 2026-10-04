import React from 'react';
import { t } from '../i18n';
import { IconButton, SliderTrack } from '@ui/components';

type Props = { min: number; max: number; since: number; onChange: (value: number) => void };

const DAY_MS = 86_400_000;

const AddedSinceFilter = ({ min, max, since, onChange }: Props) => {
  const summary = since <= min ? t('time.all') : t('time.since', { date: t.date(since) });
  return (
    <div className="flex flex-col gap-1.5 text-xs text-spice-subtext">
      <span className="flex items-center justify-between gap-2">
        <span className="font-medium text-spice-text">{summary}</span>
        {since > min && (
          <IconButton
            icon="x"
            label={t('time.reset')}
            onClick={() => onChange(min)}
            size={11}
            className="size-6"
          />
        )}
      </span>
      <SliderTrack
        min={min}
        max={max}
        step={DAY_MS}
        value={since}
        onChange={onChange}
        aria-label={t('time.label')}
        aria-valuetext={summary}
      />
      <div className="flex justify-between text-[11px] tabular-nums text-spice-subtext/70">
        <span>{t.date(min)}</span>
        <span>{t.date(max)}</span>
      </div>
    </div>
  );
};

export default AddedSinceFilter;
