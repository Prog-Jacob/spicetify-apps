import { t } from '../i18n';
import React, { useState } from 'react';
import { graphPalette } from '../graph/theme';
import { TextComponent, ButtonSecondary } from '@ui/components';
import { usePersistentState } from '../hooks/use-persistent-state';

const Row = ({ label }: { label: string }) => (
  <li className="flex gap-2">
    <span aria-hidden className="text-spice-subtext">
      •
    </span>
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
        aria-label={t('guide.help')}
        onClick={() => setOpen(true)}
        className="absolute bottom-4 start-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-spice-subtext/15 bg-spice-card/80 text-spice-subtext shadow-xl backdrop-blur-md transition-colors hover:text-spice-text"
      >
        ?
      </button>
    );
  }

  return (
    <div className="absolute bottom-16 start-3 z-20 w-72 rounded-xl border border-spice-subtext/15 bg-spice-card/80 p-4 shadow-xl backdrop-blur-md">
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
