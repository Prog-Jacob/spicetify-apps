import React from 'react';
import { t } from '../i18n';
import { cn } from '@shared/lib';
import { PANEL_SURFACE } from '../styles/chrome';
import { Divider, IconButton } from '@ui/components';

type Props = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
};

const GraphNavControls = ({ onZoomIn, onZoomOut, onFit }: Props) => (
  <div className={cn('flex items-center gap-0.5 rounded-xl p-1', PANEL_SURFACE)}>
    <IconButton icon="plus2px" label={t('nav.zoomIn')} onClick={onZoomIn} />
    <IconButton icon="minus" label={t('nav.zoomOut')} onClick={onZoomOut} />
    <Divider className="mx-0.5 my-1.5 h-auto self-stretch bg-spice-subtext/12" />
    <IconButton icon="fullscreen" label={t('nav.fit')} onClick={onFit} />
  </div>
);

export default GraphNavControls;
