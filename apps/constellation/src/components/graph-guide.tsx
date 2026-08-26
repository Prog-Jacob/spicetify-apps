import { t } from '../i18n';
import React, { useState } from 'react';
import { graphPalette } from '../graph/theme';
import { PANEL_SURFACE, FOCUS_RING } from './chrome-styles';
import { TextComponent, ButtonSecondary } from '@ui/components';
import { usePersistentState } from '../hooks/use-persistent-state';

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
  const palette = graphPalette();

  const dismiss = () => {
    setSeen(true);
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`absolute bottom-4 start-3 z-20 rounded-full border border-spice-subtext/15 bg-spice-card/80 px-3 py-1.5 text-xs font-medium text-spice-subtext shadow-xl backdrop-blur-md transition-colors hover:text-spice-text ${FOCUS_RING}`}
      >
        {t('guide.help')}
      </button>
    );
  }

  return (
    <div className={`absolute bottom-16 start-3 z-20 w-72 p-4 ${PANEL_SURFACE}`}>
      <TextComponent variant="viola" weight="bold" semanticColor="textBase">
        {t('guide.title')}
      </TextComponent>
      <ul className="mt-3 flex flex-col gap-1.5">
        <Row label={t('guide.click')} />
        <Row label={t('guide.hover')} />
        <Row label={t('guide.drag')} />
        <Row label={t('guide.expand')} />
        <Row label={t('guide.zoom')} />
      </ul>
      <div className="mt-3 h-px bg-spice-subtext/10" />
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
  );
};

export default GraphGuide;
