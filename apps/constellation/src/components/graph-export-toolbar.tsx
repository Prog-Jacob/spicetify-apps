import React from 'react';
import { t } from '../i18n';
import { SpicetifyIcon } from '@ui/components';
import { PANEL_SURFACE, FOCUS_RING_INSET } from './chrome-styles';

type Props = {
  onExportImage: () => void;
  onExportData: () => void;
};

const itemClass = `flex h-8 items-center gap-1.5 px-3 text-xs font-medium text-spice-subtext transition-colors hover:bg-spice-highlight/25 hover:text-spice-text ${FOCUS_RING_INSET}`;

const GraphExportToolbar = ({ onExportImage, onExportData }: Props) => (
  <div className={`absolute end-3 top-3 z-10 flex overflow-hidden ${PANEL_SURFACE}`}>
    <button type="button" className={itemClass} onClick={onExportImage}>
      <SpicetifyIcon icon="download" size={14} />
      {t('actions.exportImage')}
    </button>
    <div className="my-1.5 w-px bg-spice-subtext/10" />
    <button type="button" className={itemClass} onClick={onExportData}>
      <SpicetifyIcon icon="download" size={14} />
      {t('actions.exportData')}
    </button>
  </div>
);

export default GraphExportToolbar;
