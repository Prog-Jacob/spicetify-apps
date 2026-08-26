import { t } from '../i18n';
import { Input } from '@ui/components';
import React, { useState } from 'react';
import type { GraphNode } from '../types';
import { FOCUS_RING, SECTION_LABEL } from './chrome-styles';

type Props = {
  adding: boolean;
  onAdd: (input: string) => Promise<GraphNode | null>;
  onAdded: (node: GraphNode) => void;
};

const AddToGraphBox = ({ adding, onAdd, onAdded }: Props) => {
  const [value, setValue] = useState('');

  const add = async (raw: string) => {
    const input = raw.trim();
    if (!input || adding) return;
    const node = await onAdd(input);
    if (node) {
      setValue('');
      onAdded(node);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className={SECTION_LABEL}>{t('add.label')}</label>
      <div className="flex gap-1.5">
        <Input
          type="text"
          value={value}
          disabled={adding}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void add(value)}
          placeholder={t('add.placeholder')}
          aria-label={t('add.label')}
        />
        <button
          type="button"
          onClick={() => void add(value)}
          disabled={adding || !value.trim()}
          className={`shrink-0 appearance-none rounded-lg border-0 bg-spice-button px-3.5 text-xs font-semibold text-spice-main transition-[filter,background-color,color] hover:brightness-110 disabled:cursor-not-allowed disabled:bg-spice-text/[0.08] disabled:text-spice-subtext ${FOCUS_RING}`}
        >
          {adding ? t('add.adding') : t('add.button')}
        </button>
      </div>
    </div>
  );
};

export default AddToGraphBox;
