import React from 'react';
import { cn } from '@shared/lib';
import TextComponent from './text';
import SpicetifyIcon from './icon';

type SummaryTileProps = {
  icon: Spicetify.Icon;
  iconClassName?: string;
  value: string;
  label: string;
  active?: boolean;
  trailing?: React.ReactNode;
  animationDelay?: string;
  onClick?: () => void;
};

const SummaryTile = ({
  icon,
  iconClassName,
  value,
  label,
  active,
  trailing,
  animationDelay,
  onClick,
}: SummaryTileProps) => {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      {...(onClick && { type: 'button' as const, onClick })}
      className={cn(
        'flex animate-fade-in-up items-center gap-3 rounded-lg border-0 p-3 text-start transition-colors',
        onClick && 'cursor-pointer',
        active
          ? 'bg-spice-highlight-elevated ring-1 ring-spice-button/40'
          : 'bg-spice-highlight/50',
        onClick && !active && 'hover:bg-spice-highlight/80',
      )}
      style={animationDelay ? { animationDelay } : undefined}
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

export default SummaryTile;
