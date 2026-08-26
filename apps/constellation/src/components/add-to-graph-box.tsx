import { t } from '../i18n';
import { Input } from '@ui/components';
import React, { useState } from 'react';
import FriendsMenu from './friends-menu';
import type { GraphNode } from '../types';

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
      <label className="text-xs font-semibold uppercase tracking-wide text-spice-subtext/80">
        {t('add.label')}
      </label>
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
          className="shrink-0 rounded-md bg-spice-button px-3 text-xs font-semibold text-spice-main transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {adding ? t('add.adding') : t('add.button')}
        </button>
      </div>
      <FriendsMenu disabled={adding} onPick={(uri) => void add(uri)} />
    </div>
  );
};

export default AddToGraphBox;
