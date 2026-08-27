import React from 'react';
import { cn } from '@shared/lib';

type Props = {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  label?: React.ReactNode;
  valueLabel?: React.ReactNode;
  compact?: boolean;
  ariaLabel?: string;
  className?: string;
};

const TRACK =
  'w-full cursor-pointer appearance-none rounded-full bg-spice-subtext/25 accent-spice-button ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spice-button ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-spice-card';

const Slider = ({
  value,
  min,
  max,
  step,
  onChange,
  label,
  valueLabel,
  compact = false,
  ariaLabel,
  className,
}: Props) => {
  const track = (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={ariaLabel ?? (typeof label === 'string' ? label : undefined)}
      className={cn(
        TRACK,
        compact ? 'h-1' : 'h-1.5',
        label === undefined && valueLabel === undefined && className,
      )}
    />
  );

  if (label === undefined && valueLabel === undefined) return track;

  if (compact)
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {label !== undefined && (
          <span className="whitespace-nowrap text-[11px] font-medium text-spice-subtext">
            {label}
          </span>
        )}
        <span className="min-w-0 flex-1">{track}</span>
        {valueLabel !== undefined && (
          <span className="tabular-nums text-[11px] font-semibold text-spice-text">
            {valueLabel}
          </span>
        )}
      </div>
    );

  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      <span className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-spice-text">{label}</span>
        {valueLabel !== undefined && (
          <span className="tabular-nums text-spice-subtext">{valueLabel}</span>
        )}
      </span>
      {track}
    </label>
  );
};

export default Slider;
