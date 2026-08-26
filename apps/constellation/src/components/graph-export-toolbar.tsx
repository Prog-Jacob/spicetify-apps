import React from 'react';
import { t } from '../i18n';
import { SpicetifyIcon } from '@ui/components';
import { PANEL_SURFACE, FOCUS_RING_INSET } from './chrome-styles';

type Props = {
  onExportImage: () => void;
  onExportData: () => void;
};

const Divider = () => <div className="my-1.5 w-px bg-spice-subtext/10" />;

const itemClass = `flex h-8 items-center px-3 text-xs font-medium text-spice-subtext transition-colors hover:bg-spice-highlight/25 hover:text-spice-text ${FOCUS_RING_INSET}`;

const GraphExportToolbar = ({ onExportImage, onExportData }: Props) => (
  <div className={`absolute end-3 top-3 z-10 flex items-center ${PANEL_SURFACE}`}>
    <span className="flex items-center gap-1.5 ps-3 pe-2 text-spice-subtext">
      <SpicetifyIcon icon="download" size={13} />
      <span className="text-[11px] font-semibold uppercase tracking-wider">
        {t('actions.export')}
      </span>
    </span>
    <Divider />
    <button type="button" className={itemClass} onClick={onExportImage}>
      {t('actions.image')}
    </button>
    <Divider />
    <button type="button" className={itemClass} onClick={onExportData}>
      {t('actions.data')}
    </button>
  </div>
);

export default GraphExportToolbar;
