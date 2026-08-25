import React from 'react';
import { t } from '../i18n';

type Props = {
  onExportImage: () => void;
  onExportData: () => void;
};

const itemClass =
  'flex h-8 items-center px-3 text-xs font-medium text-spice-subtext transition-colors hover:bg-spice-highlight/20 hover:text-spice-text';

const GraphExportToolbar = ({ onExportImage, onExportData }: Props) => (
  <div className="absolute end-3 top-3 z-10 flex overflow-hidden rounded-full border border-spice-subtext/15 bg-spice-card/80 shadow-xl backdrop-blur-md">
    <button type="button" className={itemClass} onClick={onExportImage}>
      {t('actions.exportImage')}
    </button>
    <div className="my-1.5 w-px bg-spice-subtext/10" />
    <button type="button" className={itemClass} onClick={onExportData}>
      {t('actions.exportData')}
    </button>
  </div>
);

export default GraphExportToolbar;
