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
  const [open, setOpen] = useState(false);

  const results = useMemo(() => (query ? searchNodes(nodes, query) : []), [nodes, query]);
  const activeIndex = results.length ? Math.min(active, results.length - 1) : 0;
  const showList = open && query.length > 0;

  const retype = (value: string) => {
    setQuery(value);
    setActive(0);
    setOpen(true);
  };

  const close = () => {
    setQuery('');
    setActive(0);
    setOpen(false);
  };

  const pick = (node: GraphNode) => {
    onPick(node);
    close();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showList) {
        e.preventDefault();
        setOpen(false);
      }
      return;
    }
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((activeIndex + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      setActive((activeIndex - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(results[activeIndex]);
    }
  };

  return (
    <div
      className="relative"
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <SearchField
        value={query}
        onChange={retype}
        onClear={close}
        placeholder={t('controls.search')}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && results.length ? `${listId}-${activeIndex}` : undefined}
        aria-autocomplete="list"
        onKeyDown={onKeyDown}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          // Keep focus in the field so a click selects instead of blurring the popup shut first.
          onMouseDown={(e) => e.preventDefault()}
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
                  aria-selected={i === activeIndex}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(node)}
                  className={`group flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-start ${
                    i === activeIndex ? 'bg-spice-highlight/20' : ''
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
