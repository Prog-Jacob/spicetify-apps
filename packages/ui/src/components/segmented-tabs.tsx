import { cn } from '@shared/lib';
import React, { useRef } from 'react';
import { FOCUS_RING, INSET_SURFACE } from '../styles/surfaces';

export type Segment<T extends string> = { id: T; label: string };

type Props<T extends string> = {
  segments: Segment<T>[];
  active: T;
  onChange: (id: T) => void;
  panelId?: (id: T) => string;
};

const SegmentedTabs = <T extends string>({ segments, active, onChange, panelId }: Props<T>) => {
  const listRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (event: React.KeyboardEvent) => {
    const rtl = listRef.current && getComputedStyle(listRef.current).direction === 'rtl';
    const arrow = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    const index = segments.findIndex((segment) => segment.id === active);
    const target =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? segments.length - 1
          : arrow
            ? (index + arrow * (rtl ? -1 : 1) + segments.length) % segments.length
            : -1;
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
      onKeyDown={onKeyDown}
      className={cn(INSET_SURFACE, 'flex gap-0.5 p-0.5')}
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
            onClick={() => onChange(segment.id)}
            className={cn(
              'flex-1 rounded-md border border-transparent px-2 py-1 text-xs font-semibold transition-colors',
              FOCUS_RING,
              selected
                ? 'bg-spice-text/[0.10] text-spice-text shadow-[0_1px_2px_rgba(0,0,0,0.25)]'
                : 'bg-transparent text-spice-subtext hover:text-spice-text',
            )}
          >
            {segment.label}
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedTabs;
