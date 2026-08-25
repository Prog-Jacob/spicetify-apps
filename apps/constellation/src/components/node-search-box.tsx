import { t } from '../i18n';
import { Input } from '@ui/components';
import type { GraphNode } from '../types';
import NodeTypeDot from './node-type-dot';
import React, { useMemo, useState } from 'react';
import { searchNodes } from '../graph/node-query';
import type { MusicGraph } from '../graph/music-graph';

type Props = {
  graph: MusicGraph;
  revision: number;
  isVisible: (node: GraphNode) => boolean;
  onPick: (node: GraphNode) => void;
};

const NodeSearchBox = ({ graph, revision, isVisible, onPick }: Props) => {
  const [query, setQuery] = useState('');
  const results = useMemo(
    () => (query ? searchNodes(graph.nodes().filter(isVisible), query) : []),
    [graph, revision, isVisible, query],
  );

  const pick = (node: GraphNode) => {
    onPick(node);
    setQuery('');
  };

  return (
    <div className="relative">
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('controls.search')}
        aria-label={t('controls.search')}
      />
      {query && (
        <ul className="absolute inset-x-0 top-full mt-1 overflow-hidden rounded-md border border-spice-subtext/20 bg-spice-card/95 shadow-lg backdrop-blur">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-xs text-spice-subtext/70">{t('controls.noMatches')}</li>
          ) : (
            results.map((node) => (
              <li key={node.uri}>
                <button
                  type="button"
                  onClick={() => pick(node)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-spice-text hover:bg-spice-highlight/20"
                >
                  <NodeTypeDot type={node.type} />
                  <span className="truncate">{node.label}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-spice-subtext/60">
                    {t(`type.${node.type}`)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default NodeSearchBox;
