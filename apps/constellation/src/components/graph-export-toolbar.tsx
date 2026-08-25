import React from 'react';
import { t } from '../i18n';
import { ButtonSecondary } from '@ui/components';

type Props = {
  onExportImage: () => void;
  onExportData: () => void;
};

const GraphExportToolbar = ({ onExportImage, onExportData }: Props) => (
  <div className="absolute end-3 top-3 z-10 flex gap-2">
    <ButtonSecondary buttonSize="sm" onClick={onExportImage}>
      {t('actions.exportImage')}
    </ButtonSecondary>
    <ButtonSecondary buttonSize="sm" onClick={onExportData}>
      {t('actions.exportData')}
    </ButtonSecondary>
  </div>
);

export default GraphExportToolbar;
