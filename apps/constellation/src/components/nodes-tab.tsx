import NodeRow from './node-row';
import { t } from '../i18n';
import GraphRoster from './graph-roster';
import { cn, toggleInSet } from '@shared/lib';
import { PanelVisible } from './control-dock';
import AddToGraphBox from './add-to-graph-box';
import { SECTION_LABEL } from '../styles/chrome';
import type { MusicGraph } from '../graph/music-graph';
import { NODE_LEGEND_ORDER } from '../graph/node-style';
import { IconButton, SearchField } from '@ui/components';
import type { NodeType, GraphNode } from '../types/graph';
import type { RemovedEntry } from '../services/session-store';
import React, { useMemo, useState, useCallback, useContext } from 'react';

const COLLATOR = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
const RANK = new Map(NODE_LEGEND_ORDER.map((type, i) => [type, i]));
const NO_NODES: GraphNode[] = [];

const RemovedList = ({
  removed,
  onRestore,
}: {
  removed: RemovedEntry[];
  onRestore: (entry: RemovedEntry) => void;
}) => (
  <div className="mt-1 border-t border-spice-subtext/10 pt-2.5">
    <span className={cn(SECTION_LABEL, 'mb-1 block px-1')}>
      {t('manage.removed', { count: removed.length })}
    </span>
    <ul className="-mx-1 flex max-h-40 flex-col overflow-y-auto">
      {removed.map((entry) => (
        <NodeRow
          key={entry.node.uri}
          type={entry.node.type}
          label={entry.node.label}
          trailing={
            <IconButton
              icon="plus-alt"
              label={t('manage.restore')}
              onClick={() => onRestore(entry)}
              size={13}
              className="h-6 w-6"
            />
          }
        />
      ))}
    </ul>
  </div>
);

type Props = {
  graph: MusicGraph;
  revision: number;
  removed: RemovedEntry[];
  adding: boolean;
  onAdd: (input: string) => Promise<GraphNode | null>;
  onAdded: (node: GraphNode) => void;
  onRemove: (node: GraphNode) => void;
  onRestore: (entry: RemovedEntry) => void;
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
}: Props) => {
  const visible = useContext(PanelVisible);
  const [query, setQuery] = useState('');
  const [muted, setMuted] = useState<Set<NodeType>>(() => new Set());
  const toggleType = useCallback((type: NodeType) => setMuted((m) => toggleInSet(m, type)), []);

  const counts = useMemo(() => {
    const byType = new Map<NodeType, number>();
    if (!visible) return byType;
    for (const node of graph.nodes()) byType.set(node.type, (byType.get(node.type) ?? 0) + 1);
    return byType;
  }, [graph, revision, visible]);

  const pool = useMemo(
    () =>
      visible
        ? graph
            .nodes()
            .filter((n) => !muted.has(n.type))
            .sort(
              (a, b) => RANK.get(a.type)! - RANK.get(b.type)! || COLLATOR.compare(a.label, b.label),
            )
        : NO_NODES,
    [graph, revision, muted, visible],
  );

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
