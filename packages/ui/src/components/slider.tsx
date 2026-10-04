import React from 'react';
import { cn } from '@shared/lib';
import { FOCUS_RING } from '../styles/surfaces';

const THUMB_PX = 14;

/**
 * Spotify styles `input[type=range]` globally with a 48px left pad for its own layout resizer,
 * and that selector outranks a utility class: hence `p-0!`, and a fill painted here rather than
 * left to `accent-color`.
 */
const TRACK = cn(
  'w-full cursor-pointer appearance-none rounded-full bg-spice-subtext/25 p-0!',
  '[&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
  '[&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-spice-button [&::-webkit-slider-thumb]:shadow-md',
  FOCUS_RING,
  'focus-visible:ring-offset-2 focus-visible:ring-offset-spice-card',
);

const fillTo = (ratio: number): string =>
  `linear-gradient(to var(--flow-end, right), var(--spice-button) calc(${ratio * 100}% + ${(
    (0.5 - ratio) *
    THUMB_PX
  ).toFixed(2)}px), transparent 0)`;

type TrackProps = Omit<React.ComponentProps<'input'>, 'type' | 'value' | 'onChange'> & {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  thin?: boolean;
};

/** A bare themed range input; label it with `aria-label` or wrap it in a `<label>`. */
export const SliderTrack = React.forwardRef<HTMLInputElement, TrackProps>(
  ({ value, min, max, step, onChange, thin, className, style, ...rest }, ref) => {
    const ratio = max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0;
    return (
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ backgroundImage: fillTo(ratio), ...style }}
        className={cn(TRACK, thin ? 'h-1' : 'h-1.5', className)}
        {...rest}
      />
    );
  },
);
SliderTrack.displayName = 'SliderTrack';

type LabeledProps = Omit<TrackProps, 'thin' | 'aria-valuetext'> & {
  label: string;
  /** Displayed current value, e.g. `1.25×`; spoken via `aria-valuetext`, not the label. */
  valueLabel?: string;
};

export const Slider = ({ label, valueLabel, className, ...track }: LabeledProps) => (
  <label className={cn('flex flex-col gap-1.5', className)}>
    <span className="flex items-center justify-between gap-2 text-xs">
      <span className="font-medium text-spice-text">{label}</span>
      {valueLabel !== undefined && (
        <span aria-hidden className="tabular-nums text-spice-subtext">
          {valueLabel}
        </span>
      )}
    </span>
    <SliderTrack {...track} aria-valuetext={valueLabel} />
  </label>
);

export const InlineSlider = ({ label, valueLabel, className, ...track }: LabeledProps) => (
  <label className={cn('flex items-center gap-2', className)}>
    <span className="whitespace-nowrap text-[11px] font-medium text-spice-subtext">{label}</span>
    <span className="min-w-0 flex-1">
      <SliderTrack thin {...track} aria-valuetext={valueLabel} />
    </span>
    {valueLabel !== undefined && (
      <span aria-hidden className="tabular-nums text-[11px] font-semibold text-spice-text">
        {valueLabel}
      </span>
    )}
  </label>
);
