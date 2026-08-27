import React from 'react';
import { cn } from '@shared/lib';
import { FOCUS_RING, INSET_SURFACE } from './chrome-styles';

export type Segment<T extends string> = { id: T; label: string };

type Props<T extends string> = {
  segments: Segment<T>[];
  active: T;
  onChange: (id: T) => void;
};

const SegmentedTabs = <T extends string>({ segments, active, onChange }: Props<T>) => (
  <div role="tablist" className={cn(INSET_SURFACE, 'flex gap-0.5 p-0.5')}>
    {segments.map((segment) => {
      const selected = segment.id === active;
      return (
        <button
          key={segment.id}
          type="button"
          role="tab"
          aria-selected={selected}
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

export default SegmentedTabs;
