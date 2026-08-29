import React from 'react';
import { t } from '../i18n';
import { SpicetifyIcon, Divider } from '@ui/components';
import { PANEL_SURFACE, FOCUS_RING_INSET } from '../styles/chrome';

type Props = {
  onExportImage: () => void;
  onExportData: () => void;
};

const itemClass = `flex h-8 items-center px-3 text-xs font-medium text-spice-subtext transition-colors hover:bg-spice-highlight/25 hover:text-spice-text ${FOCUS_RING_INSET}`;

const GraphExportToolbar = ({ onExportImage, onExportData }: Props) => (
  <div className={`flex items-center ${PANEL_SURFACE}`}>
    <span className="flex items-center gap-1.5 ps-3 pe-2 text-spice-subtext">
      <SpicetifyIcon icon="download" size={13} />
      <span className="text-[11px] font-semibold uppercase tracking-wider">
        {t('actions.export')}
      </span>
    </span>
    <Divider className="my-1.5 h-auto self-stretch" />
    <button type="button" className={itemClass} onClick={onExportImage}>
      {t('actions.image')}
    </button>
    <Divider className="my-1.5 h-auto self-stretch" />
    <button type="button" className={itemClass} onClick={onExportData}>
      {t('actions.data')}
    </button>
  </div>
);

export default GraphExportToolbar;
