import { t } from '../i18n';
import { cn } from '@shared/lib';
import React, { useMemo } from 'react';
import { TypeChip } from './type-filter';
import { SECTION_LABEL } from './chrome-styles';
import NodeRow, { RowAction } from './node-row';
import { searchNodes } from '../graph/node-query';
import type { NodeType, GraphNode } from '../types';
import { NODE_LEGEND_ORDER } from '../graph/node-style';

const CAP = 120;

const GraphRoster = ({
  pool,
  counts,
  muted,
  query,
  onToggleType,
  onRemove,
  onSelect,
}: {
  pool: GraphNode[];
  counts: Map<NodeType, number>;
  muted: Set<NodeType>;
  query: string;
  onToggleType: (type: NodeType) => void;
  onRemove: (node: GraphNode) => void;
  onSelect: (node: GraphNode) => void;
}) => {
  const q = query.trim();
  const matched = useMemo(() => (q ? searchNodes(pool, q, pool.length) : pool), [pool, q]);
  const shown = matched.slice(0, CAP);
  const overflow = matched.length - shown.length;
  const chipTypes = NODE_LEGEND_ORDER.filter((type) => counts.has(type));
  const allHidden = chipTypes.length > 0 && chipTypes.every((type) => muted.has(type));

  return (
    <>
      <span className={cn(SECTION_LABEL, 'mb-1.5 block')}>{t('manage.filter')}</span>
      <div className="mb-2.5 flex flex-wrap gap-1.5">
        {chipTypes.map((type) => (
          <TypeChip
            key={type}
            type={type}
            active={!muted.has(type)}
            onToggle={() => onToggleType(type)}
            count={counts.get(type)}
          />
        ))}
      </div>

      <span className="sr-only" aria-live="polite">
        {t('controls.resultCount', { count: matched.length })}
      </span>
      <ul className="-mx-1 flex max-h-[42vh] flex-col overflow-y-auto">
        {shown.length === 0 ? (
          <li className="px-2.5 py-3 text-xs text-spice-subtext/70">
            {q
              ? t('controls.noMatches')
              : allHidden
                ? t('manage.allHidden')
                : t('manage.emptyPool')}
          </li>
        ) : (
          shown.map((node) => (
            <NodeRow
              key={node.uri}
              type={node.type}
              label={node.label}
              onSelect={() => onSelect(node)}
              trailing={
                <RowAction
                  icon="minus"
                  label={t('inspector.remove')}
                  onClick={() => onRemove(node)}
                />
              }
            />
          ))
        )}
      </ul>
      {overflow > 0 && (
        <span className="px-2.5 pt-1.5 text-[11px] text-spice-subtext/60">
          {t('manage.more', { count: overflow })}
        </span>
      )}
    </>
  );
};

export default GraphRoster;
