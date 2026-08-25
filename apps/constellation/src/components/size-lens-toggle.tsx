import React from 'react';
import { t } from '../i18n';
import ToggleChip from './toggle-chip';

type Props = { active: boolean; onToggle: () => void };

const SizeLensToggle = ({ active, onToggle }: Props) => (
  <ToggleChip active={active} onToggle={onToggle} className="self-start">
    {t('lens.byDegree')}
  </ToggleChip>
);

export default SizeLensToggle;
