import React from 'react';
import { t } from '../i18n';
import { cn } from '@shared/lib/utils';
import { SpicetifyIcon } from '@ui/components/ui/icon';

const { TextComponent } = Spicetify.ReactComponent;

type DataTypeCardProps = {
  icon: Spicetify.Icon;
  label: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
  count?: number;
};

const DataTypeCard = ({
  icon,
  label,
  description,
  selected,
  disabled,
  onToggle,
  count,
}: DataTypeCardProps) => (
  <button
    role="switch"
    aria-checked={selected}
    aria-label={t('dataType.include', { label })}
    disabled={disabled}
    onClick={onToggle}
    className={cn(
      'group flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spice-button',
      disabled ? 'cursor-default' : 'cursor-pointer',
      selected
        ? 'border-spice-button/40 bg-spice-highlight-elevated hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-lg hover:shadow-spice-shadow/30'
        : 'border-transparent bg-spice-card hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-spice-highlight hover:shadow-md hover:shadow-spice-shadow/20',
    )}
  >
    <div
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full transition-colors duration-150',
        selected ? 'bg-spice-button/20 text-spice-button' : 'bg-spice-sidebar text-spice-subtext',
      )}
    >
      <SpicetifyIcon icon={icon} size={20} />
    </div>

    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <TextComponent variant="viola" weight="bold">
        {label}
      </TextComponent>
      <TextComponent variant="minuet" semanticColor="textSubdued" className="opacity-50">
        {description}
      </TextComponent>
      {count !== undefined && (
        <TextComponent variant="minuet" semanticColor="textSubdued">
          {t('dataType.itemCount', { count })}
        </TextComponent>
      )}
    </div>

    <div
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150',
        selected
          ? 'animate-scale-in border-spice-button bg-spice-button text-spice-main'
          : 'border-spice-subtext/30 bg-transparent group-hover:border-spice-subtext/60',
      )}
    >
      {selected && <SpicetifyIcon icon="check-alt-fill" size={14} />}
    </div>
  </button>
);

export default DataTypeCard;
