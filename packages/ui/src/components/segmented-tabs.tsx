import { cn } from '@shared/lib';
import React, { useRef } from 'react';
import { rovingIndex } from '../lib/roving';
import { SpicetifyIcon } from './spicetify-icon';
import { FOCUS_RING, INSET_SURFACE } from '../styles/surfaces';

export type Segment<T extends string> = { id: T; label: string; icon?: Spicetify.Icon };

type SegmentedTabsProps<T extends string> = {
  segments: Segment<T>[];
  active: T;
  onChange: (id: T) => void;
  /** Id of the panel each tab controls; the tab itself gets `${panelId(id)}-tab`. */
  panelId?: (id: T) => string;
  /** `inset` fills its container (dense panels); `pill` sizes to content (page-level mode switch). */
  variant?: 'inset' | 'pill';
  disabled?: boolean;
  label?: string;
};

const STYLES = {
  inset: {
    list: cn(INSET_SURFACE, 'flex gap-0.5 p-0.5'),
    tab: 'flex-1 rounded-md px-2 py-1 text-xs font-semibold',
    on: 'bg-spice-text/[0.10] text-spice-text shadow-sm shadow-spice-shadow/40',
    off: 'text-spice-subtext hover:text-spice-text',
  },
  pill: {
    list: 'flex w-fit gap-1 rounded-full bg-spice-highlight/60 p-1',
    tab: 'rounded-full px-4 py-1.5 text-sm font-medium',
    on: 'bg-spice-text text-spice-main',
    off: 'text-spice-subtext hover:bg-spice-highlight hover:text-spice-text',
  },
} as const;

/** WAI-ARIA tabs with arrow/Home/End keys that follow the reading direction. */
export const SegmentedTabs = <T extends string>({
  segments,
  active,
  onChange,
  panelId,
  variant = 'inset',
  disabled,
  label,
}: SegmentedTabsProps<T>) => {
  const listRef = useRef<HTMLDivElement>(null);
  const style = STYLES[variant];

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const index = segments.findIndex((segment) => segment.id === active);
    const target = rovingIndex(event, index, segments.length);
    if (target < 0) return;
    event.preventDefault();
    const next = segments[target];
    onChange(next.id);
    listRef.current?.querySelector<HTMLButtonElement>(`[data-segment="${next.id}"]`)?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={style.list}
    >
      {segments.map((segment) => {
        const selected = segment.id === active;
        return (
          <button
            key={segment.id}
            type="button"
            role="tab"
            id={panelId && `${panelId(segment.id)}-tab`}
            data-segment={segment.id}
            aria-selected={selected}
            aria-controls={panelId?.(segment.id)}
            tabIndex={selected ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(segment.id)}
            className={cn(
              'flex items-center justify-center gap-1.5 border border-transparent bg-transparent transition-colors disabled:pointer-events-none disabled:opacity-60',
              style.tab,
              FOCUS_RING,
              selected ? style.on : style.off,
            )}
          >
            {segment.icon && <SpicetifyIcon icon={segment.icon} size={14} />}
            {segment.label}
          </button>
        );
      })}
    </div>
  );
};
