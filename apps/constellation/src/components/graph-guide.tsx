import { t } from '../i18n';
import { cn } from '@shared/lib';
import React, { useState } from 'react';
import { useGraphPalette } from '../graph/theme';
import { FOCUS_RING } from '@ui/styles/surfaces';
import { PANEL_SURFACE } from '../styles/chrome';
import { usePersistentState } from '@shared/hooks';
import { Divider, TextComponent, ButtonSecondary } from '@ui/components';

const Row = ({ label }: { label: string }) => (
  <li className="flex items-start gap-2.5">
    <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-spice-button/70" />
    <TextComponent variant="mesto" semanticColor="textSubdued">
      {label}
    </TextComponent>
  </li>
);

const Swatch = ({ color, label }: { color: string; label: string }) => (
  <span className="flex items-center gap-1.5">
    <span
      className="inline-block h-2.5 w-4 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
    />
    <TextComponent variant="minuet" semanticColor="textSubdued">
      {label}
    </TextComponent>
  </span>
);

const GraphGuide = () => {
  const [seen, setSeen] = usePersistentState('guide-seen', false);
  const [open, setOpen] = useState(!seen);
  const palette = useGraphPalette();

  const dismiss = () => {
    setSeen(true);
    setOpen(false);
  };

  return (
    <div className="relative flex flex-col items-start">
      {open && (
        <div
          className={cn(
            'animate-fade-in-up absolute bottom-full start-0 z-20 mb-2 w-72 p-4',
            PANEL_SURFACE,
          )}
        >
          <TextComponent variant="viola" weight="bold" semanticColor="textBase">
            {t('guide.title')}
          </TextComponent>
          <ul className="mt-3 flex flex-col gap-1.5">
            <Row label={t('guide.click')} />
            <Row label={t('guide.drag')} />
            <Row label={t('guide.mark')} />
            <Row label={t('guide.open')} />
            <Row label={t('guide.controls')} />
            <Row label={t('guide.zoom')} />
            <Row label={t('guide.keyboard')} />
          </ul>
          <Divider orientation="horizontal" className="mt-3 bg-spice-subtext/10" />
          <div className="mt-3 flex flex-col gap-1.5">
            <Swatch color={palette.link} label={t('guide.legendLibrary')} />
            <Swatch color={palette.color.artist} label={t('guide.legendCollab')} />
          </div>
          <div className="mt-4 flex justify-end">
            <ButtonSecondary buttonSize="sm" onClick={dismiss}>
              {t('guide.dismiss')}
            </ButtonSecondary>
          </div>
        </div>
      )}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center rounded-full border border-spice-subtext/25 bg-spice-card/80 px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-md transition-colors hover:text-spice-text',
          open ? 'text-spice-text' : 'text-spice-subtext',
          FOCUS_RING,
        )}
      >
        {open ? t('guide.hide') : t('guide.help')}
      </button>
    </div>
  );
};

export default GraphGuide;
