import { t } from '../i18n';
import { NodeRowContent } from './node-row';
import { SearchField } from '@ui/components';
import type { GraphNode } from '../types/graph';
import { searchNodes } from '../graph/node-query';
import React, { useId, useMemo, useState } from 'react';

type Props = {
  nodes: GraphNode[];
  onPick: (node: GraphNode) => void;
};

const NodeSearchBox = ({ nodes, onPick }: Props) => {
  const listId = useId();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const results = useMemo(() => (query ? searchNodes(nodes, query) : []), [nodes, query]);

  const retype = (value: string) => {
    setQuery(value);
    setActive(0);
  };

  const pick = (node: GraphNode) => {
    onPick(node);
    retype('');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') return retype('');
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(results[active]);
    }
  };

  return (
    <div className="relative">
      <SearchField
        value={query}
        onChange={retype}
        onClear={() => retype('')}
        placeholder={t('controls.search')}
        role="combobox"
        aria-expanded={query.length > 0}
        aria-controls={listId}
        aria-activedescendant={results.length ? `${listId}-${active}` : undefined}
        aria-autocomplete="list"
        onKeyDown={onKeyDown}
      />
      {query && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-spice-subtext/20 bg-spice-card/95 shadow-xl backdrop-blur"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2.5 text-xs text-spice-subtext/70">{t('controls.noMatches')}</li>
          ) : (
            <>
              <li
                aria-hidden
                className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-spice-subtext/60"
              >
                {t('controls.resultCount', { count: results.length })}
              </li>
              {results.map((node, i) => (
                <li
                  key={node.uri}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(node)}
                  className={`group flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-start ${
                    i === active ? 'bg-spice-highlight/20' : ''
                  }`}
                >
                  <NodeRowContent type={node.type} label={node.label} />
                </li>
              ))}
            </>
          )}
        </ul>
      )}
    </div>
  );
};

export default NodeSearchBox;
