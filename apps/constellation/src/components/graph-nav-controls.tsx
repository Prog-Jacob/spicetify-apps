import React from 'react';
import { t } from '../i18n';

type Props = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
};

const buttonClass =
  'flex h-8 w-8 items-center justify-center text-lg leading-none text-spice-subtext transition-colors hover:bg-spice-highlight/20 hover:text-spice-text';

const GraphNavControls = ({ onZoomIn, onZoomOut, onFit }: Props) => (
  <div className="absolute bottom-4 end-3 z-10 flex flex-col overflow-hidden rounded-full border border-spice-subtext/15 bg-spice-card/80 shadow-xl backdrop-blur-md">
    <button type="button" className={buttonClass} onClick={onZoomIn} aria-label={t('nav.zoomIn')}>
      +
    </button>
    <div className="mx-2 h-px bg-spice-subtext/10" />
    <button type="button" className={buttonClass} onClick={onZoomOut} aria-label={t('nav.zoomOut')}>
      −
    </button>
    <div className="mx-2 h-px bg-spice-subtext/10" />
    <button
      type="button"
      className={`${buttonClass} text-sm`}
      onClick={onFit}
      aria-label={t('nav.fit')}
    >
      ⤢
    </button>
  </div>
);

export default GraphNavControls;
