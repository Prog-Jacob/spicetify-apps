import { t } from '../i18n';
import GraphRoster from './graph-roster';
import SearchField from './search-field';
import { cn, toggleInSet } from '@shared/lib';
import AddToGraphBox from './add-to-graph-box';
import { SECTION_LABEL } from './chrome-styles';
import NodeRow, { RowAction } from './node-row';
import type { NodeType, GraphNode } from '../types';
import type { MusicGraph } from '../graph/music-graph';
import { NODE_LEGEND_ORDER } from '../graph/node-style';
import type { RemovedEntry } from '../services/session-store';
import React, { useMemo, useState, useCallback } from 'react';

const RemovedList = ({
  removed,
  onRestore,
}: {
  removed: RemovedEntry[];
  onRestore: (uri: string) => void;
}) => (
  <div className="mt-1 border-t border-spice-subtext/10 pt-2.5">
    <span className={cn(SECTION_LABEL, 'mb-1 block px-1')}>
      {t('manage.removed', { count: removed.length })}
    </span>
    <ul className="-mx-1 flex max-h-40 flex-col overflow-y-auto">
      {removed.map((entry) => (
        <NodeRow
          key={entry.uri}
          type={entry.type}
          label={entry.label}
          trailing={
            <RowAction
              icon="plus-alt"
              label={t('manage.restore')}
              onClick={() => onRestore(entry.uri)}
            />
          }
        />
      ))}
    </ul>
  </div>
);

export type NodesTabProps = {
  graph: MusicGraph;
  revision: number;
  removed: RemovedEntry[];
  adding: boolean;
  onAdd: (input: string) => Promise<GraphNode | null>;
  onAdded: (node: GraphNode) => void;
  onRemove: (node: GraphNode) => void;
  onRestore: (uri: string) => void;
  onSelect: (node: GraphNode) => void;
};

const NodesTab = ({
  graph,
  revision,
  removed,
  adding,
  onAdd,
  onAdded,
  onRemove,
  onRestore,
  onSelect,
}: NodesTabProps) => {
  const [query, setQuery] = useState('');
  const [muted, setMuted] = useState<Set<NodeType>>(() => new Set());

  const toggleType = useCallback(
    (type: NodeType) => setMuted((prev) => toggleInSet(prev, type)),
    [],
  );

  const counts = useMemo(() => {
    const c = new Map<NodeType, number>();
    for (const n of graph.nodes()) c.set(n.type, (c.get(n.type) ?? 0) + 1);
    return c;
  }, [graph, revision]);

  const pool = useMemo(() => {
    const rank = (type: NodeType) => NODE_LEGEND_ORDER.indexOf(type);
    return graph
      .nodes()
      .filter((n) => !muted.has(n.type))
      .sort((a, b) => rank(a.type) - rank(b.type) || a.label.localeCompare(b.label));
  }, [graph, revision, muted]);

  return (
    <div className="flex flex-col gap-2.5">
      <AddToGraphBox adding={adding} onAdd={onAdd} onAdded={onAdded} />
      <SearchField value={query} onChange={setQuery} placeholder={t('manage.search')} />
      <GraphRoster
        pool={pool}
        counts={counts}
        muted={muted}
        query={query}
        onToggleType={toggleType}
        onRemove={onRemove}
        onSelect={onSelect}
      />
      {removed.length > 0 && <RemovedList removed={removed} onRestore={onRestore} />}
    </div>
  );
};

export default NodesTab;
