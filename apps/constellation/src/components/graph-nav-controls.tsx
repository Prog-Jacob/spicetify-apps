import React from 'react';
import { t } from '../i18n';
import { IconButton } from '@ui/components';
import { PANEL_SURFACE } from './chrome-styles';

type Props = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
};

const navButton = '!text-spice-text/90 hover:!text-spice-text';

const GraphNavControls = ({ onZoomIn, onZoomOut, onFit }: Props) => (
  <div className={`absolute bottom-4 end-3 z-10 flex flex-col gap-0.5 p-1 ${PANEL_SURFACE}`}>
    <IconButton icon="plus2px" label={t('nav.zoomIn')} onClick={onZoomIn} className={navButton} />
    <IconButton icon="minus" label={t('nav.zoomOut')} onClick={onZoomOut} className={navButton} />
    <div className="mx-1.5 my-0.5 h-px bg-spice-subtext/10" />
    <IconButton icon="fullscreen" label={t('nav.fit')} onClick={onFit} className={navButton} />
  </div>
);

export default GraphNavControls;
