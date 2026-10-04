import React from 'react';
import { cn } from '@shared/lib';
import { stagger } from '../lib/stagger';
import { FOCUS_RING } from '../styles/surfaces';
import { SpicetifyIcon } from './spicetify-icon';
import { TextComponent } from './text-component';

type SummaryTileProps = {
  icon: Spicetify.Icon;
  iconClassName?: string;
  value: string;
  label: string;
  active?: boolean;
  trailing?: React.ReactNode;
  index?: number;
  onClick?: () => void;
};

export const SummaryTile = ({
  icon,
  iconClassName,
  value,
  label,
  active,
  trailing,
  index = 0,
  onClick,
}: SummaryTileProps) => {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      {...(onClick && { type: 'button' as const, onClick, 'aria-pressed': active })}
      className={cn(
        'flex animate-fade-in-up items-center gap-3 rounded-lg border-0 p-3 text-start transition-colors',
        onClick && cn('cursor-pointer', FOCUS_RING),
        active
          ? 'bg-spice-highlight-elevated ring-1 ring-spice-button/40'
          : 'bg-spice-highlight/50',
        onClick && !active && 'hover:bg-spice-highlight/80',
      )}
      style={stagger(index, 80)}
    >
      <SpicetifyIcon
        icon={icon}
        className={cn('shrink-0', iconClassName ?? 'text-spice-subtext')}
      />
      <div className="flex min-w-0 flex-col">
        <TextComponent variant="alto" weight="bold">
          {value}
        </TextComponent>
        <TextComponent variant="minuet" semanticColor="textSubdued">
          {label}
        </TextComponent>
      </div>
      {trailing}
    </Tag>
  );
};
