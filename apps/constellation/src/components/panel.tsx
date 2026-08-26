import React from 'react';
import { t } from '../i18n';
import { cn } from '@shared/lib';
import { IconButton, SpicetifyIcon } from '@ui/components';
import { PANEL_SURFACE, FOCUS_RING } from './chrome-styles';

type Props = {
  icon: Spicetify.Icon;
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
  children: React.ReactNode;
};

const Panel = ({ icon, title, collapsed, onToggle, className, children }: Props) => {
  if (collapsed)
    return (
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'animate-fade-in-up flex items-center gap-2 self-start px-3 py-2 text-xs font-medium text-spice-text',
          PANEL_SURFACE,
          FOCUS_RING,
        )}
      >
        <SpicetifyIcon icon={icon} size={14} />
        {title}
      </button>
    );

  return (
    <div className={cn('animate-fade-in-up flex flex-col', PANEL_SURFACE, className)}>
      <div className="flex shrink-0 items-center justify-between gap-2 px-3.5 pb-2 pt-3.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-spice-text">
          <SpicetifyIcon icon={icon} size={13} />
          {title}
        </span>
        <IconButton
          icon="minimize"
          label={t('panel.hide')}
          onClick={onToggle}
          size={13}
          className="h-7 w-7"
        />
      </div>
      {children}
    </div>
  );
};

export default Panel;
