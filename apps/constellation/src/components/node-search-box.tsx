import { t } from '../i18n';
import { Input } from '@ui/components';
import type { GraphNode } from '../types';
import NodeTypeDot from './node-type-dot';
import { searchNodes } from '../graph/node-query';
import type { MusicGraph } from '../graph/music-graph';
import React, { useId, useMemo, useState } from 'react';

type Props = {
  graph: MusicGraph;
  revision: number;
  isVisible: (node: GraphNode) => boolean;
  onPick: (node: GraphNode) => void;
};

const NodeSearchBox = ({ graph, revision, isVisible, onPick }: Props) => {
  const listId = useId();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const visible = useMemo(() => graph.nodes().filter(isVisible), [graph, revision, isVisible]);
  const results = useMemo(() => (query ? searchNodes(visible, query) : []), [visible, query]);

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
      <Input
        type="text"
        role="combobox"
        aria-expanded={query.length > 0}
        aria-controls={listId}
        aria-activedescendant={results.length ? `${listId}-${active}` : undefined}
        aria-autocomplete="list"
        value={query}
        onChange={(e) => retype(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={t('controls.search')}
        aria-label={t('controls.search')}
      />
      {query && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full mt-1 overflow-hidden rounded-md border border-spice-subtext/20 bg-spice-card/95 shadow-lg backdrop-blur"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2 text-xs text-spice-subtext/70">{t('controls.noMatches')}</li>
          ) : (
            results.map((node, i) => (
              <li
                key={node.uri}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(node)}
                className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 text-start text-sm text-spice-text ${
                  i === active ? 'bg-spice-highlight/20' : ''
                }`}
              >
                <NodeTypeDot type={node.type} />
                <span className="truncate">{node.label}</span>
                <span className="ms-auto shrink-0 text-[10px] text-spice-subtext/60">
                  {t(`type.${node.type}`)}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default NodeSearchBox;
