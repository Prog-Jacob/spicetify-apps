import React from 'react';
import { cn } from '@shared/lib/utils';
import { SpicetifyIcon } from '@ui/components/ui/icon';

const { TextComponent } = Spicetify.ReactComponent;

type StatusHeaderProps = {
  icon: Spicetify.Icon;
  iconClassName: string;
  title: string;
  semanticColor?: string;
};

const StatusHeader = ({ icon, iconClassName, title, semanticColor }: StatusHeaderProps) => (
  <div className="flex items-center gap-3">
    <div
      className={cn(
        'flex size-10 animate-scale-in items-center justify-center rounded-full',
        iconClassName,
      )}
    >
      <SpicetifyIcon icon={icon} size={24} />
    </div>
    <TextComponent variant="alto" weight="bold" semanticColor={semanticColor}>
      {title}
    </TextComponent>
  </div>
);

export default StatusHeader;
