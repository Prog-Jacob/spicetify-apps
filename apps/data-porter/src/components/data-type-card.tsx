import React from 'react';
import { t } from '../i18n';
import { cn } from '@shared/lib';
import { Pill, TextComponent, SpicetifyIcon } from '@ui/components';

type DataTypeCardProps = {
  icon: Spicetify.Icon;
  label: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onPreview?: () => void;
  count?: number;
  badge?: string;
};

// The toggle is a childless button stretched under the content, so the
// preview pill can be a real sibling <button> (no interactive nesting
// inside role="switch"). Content is pointer-events-none to let clicks
// fall through to the toggle.
const DataTypeCard = ({
  icon,
  label,
  description,
  selected,
  disabled,
  onToggle,
  onPreview,
  count,
  badge,
}: DataTypeCardProps) => (
  <div
    className={cn(
      'group relative flex items-center gap-4 rounded-xl border p-4 transition-all duration-150',
      !disabled && 'hover:-translate-y-0.5 hover:scale-[1.02]',
      selected
        ? 'border-spice-button/40 bg-spice-highlight-elevated hover:shadow-lg hover:shadow-spice-shadow/30'
        : 'border-transparent bg-spice-card hover:bg-spice-highlight hover:shadow-md hover:shadow-spice-shadow/20',
    )}
  >
    <button
      role="switch"
      aria-checked={selected}
      aria-label={t('dataType.include', { label })}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'absolute inset-0 rounded-xl border-0 bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spice-button',
        disabled ? 'cursor-default' : 'cursor-pointer',
      )}
    />

    <div
      className={cn(
        'pointer-events-none flex size-10 shrink-0 items-center justify-center rounded-full transition-colors duration-150',
        selected ? 'bg-spice-button/20 text-spice-button' : 'bg-spice-sidebar text-spice-subtext',
      )}
    >
      <SpicetifyIcon icon={icon} size={20} />
    </div>

    {badge && <Pill className="pointer-events-none absolute right-2 bottom-2">{badge}</Pill>}

    <div className="pointer-events-none flex min-w-0 flex-1 flex-col gap-0.5">
      <TextComponent variant="viola" weight="bold">
        {label}
      </TextComponent>
      <TextComponent variant="minuet" semanticColor="textSubdued" className="opacity-50">
        {description}
      </TextComponent>
      {count !== undefined &&
        (onPreview ? (
          <button
            type="button"
            onClick={onPreview}
            aria-label={t('preview.open', { label })}
            className="pointer-events-auto z-10 mt-0.5 flex cursor-pointer items-center gap-1 self-start rounded-full border-0 bg-spice-subtext/10 px-2 py-0.5 text-xs text-spice-subtext transition-colors hover:bg-spice-button/20 hover:text-spice-button"
          >
            {t('dataType.itemCount', { count })}
            <SpicetifyIcon icon="chevron-right" size={10} className="rtl:rotate-180" />
          </button>
        ) : (
          <TextComponent variant="minuet" semanticColor="textSubdued">
            {t('dataType.itemCount', { count })}
          </TextComponent>
        ))}
    </div>

    <div
      className={cn(
        'pointer-events-none flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150',
        selected
          ? 'animate-scale-in border-spice-button bg-spice-button text-spice-main'
          : 'border-spice-subtext/30 bg-transparent group-hover:border-spice-subtext/60',
      )}
    >
      {selected && <SpicetifyIcon icon="check-alt-fill" size={14} />}
    </div>
  </div>
);

export default DataTypeCard;
