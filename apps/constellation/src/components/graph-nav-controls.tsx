import React from 'react';
import { t } from '../i18n';
import { cn } from '@shared/lib';
import { IconButton } from '@ui/components';
import { PANEL_SURFACE } from './chrome-styles';

type Props = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
};

const GraphNavControls = ({ onZoomIn, onZoomOut, onFit }: Props) => (
  <div className={cn('flex flex-col gap-0.5 rounded-xl p-1', PANEL_SURFACE)}>
    <IconButton icon="plus2px" label={t('nav.zoomIn')} onClick={onZoomIn} />
    <IconButton icon="minus" label={t('nav.zoomOut')} onClick={onZoomOut} />
    <div className="mx-1.5 my-0.5 h-px bg-spice-subtext/12" />
    <IconButton icon="fullscreen" label={t('nav.fit')} onClick={onFit} />
  </div>
);

export default GraphNavControls;
