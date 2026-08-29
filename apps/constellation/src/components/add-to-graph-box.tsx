import { t } from '../i18n';
import React, { useState } from 'react';
import type { GraphNode } from '../types/graph';
import { SECTION_LABEL } from '../styles/chrome';
import { Input, ButtonPrimary } from '@ui/components';

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
        <ButtonPrimary
          buttonSize="sm"
          onClick={() => void add(value)}
          disabled={adding || !value.trim()}
        >
          {adding ? t('add.adding') : t('add.button')}
        </ButtonPrimary>
      </div>
    </div>
  );
};

export default AddToGraphBox;
