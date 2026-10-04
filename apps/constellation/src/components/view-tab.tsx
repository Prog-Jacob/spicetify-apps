import { t } from '../i18n';
import TypeFilter from './type-filter';
import { SECTION_LABEL } from '@ui/styles';
import { PanelVisible } from './control-dock';
import AddedSinceFilter from './added-since-filter';
import type { TimeBounds } from '../graph/node-query';
import React, { memo, useMemo, useContext } from 'react';
import { expandableNodes } from '../hooks/use-expand-all';
import { ToggleChip, ActionButton } from '@ui/components';
import type { NodeType, GraphNode } from '../types/graph';
import type { Lenses, LensKey } from '../hooks/use-graph-controls';

type Props = {
  visibleTypes: Set<NodeType>;
  onToggleType: (type: NodeType) => void;
  lenses: Lenses;
  onToggleLens: (key: LensKey) => void;
  timeBounds: TimeBounds | null;
  since: number;
  onSinceChange: (value: number) => void;
  visibleNodes: GraphNode[];
  expanded: ReadonlySet<string>;
  pinnedCount: number;
  filtersActive: boolean;
  refreshing: boolean;
  onResetFilters: () => void;
  onExpandAll: (nodes: GraphNode[]) => void;
  onReleasePins: () => void;
  onReload: () => void;
};

const LENS_LABELS = {
  sizeByDegree: 'lens.byDegree',
  colorByCluster: 'lens.byCluster',
  showCollaborations: 'edges.collaborations',
  connectedOnly: 'lens.connected',
} as const satisfies Record<LensKey, string>;

const LENS_KEYS = Object.keys(LENS_LABELS) as LensKey[];

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <span className={SECTION_LABEL}>{label}</span>
    {children}
  </div>
);

const ViewTab = ({
  visibleTypes,
  onToggleType,
  lenses,
  onToggleLens,
  timeBounds,
  since,
  onSinceChange,
  visibleNodes,
  expanded,
  pinnedCount,
  filtersActive,
  refreshing,
  onResetFilters,
  onExpandAll,
  onReleasePins,
  onReload,
}: Props) => {
  const visible = useContext(PanelVisible);
  const expandable = useMemo(
    () => (visible ? expandableNodes(expanded, visibleNodes).length : 0),
    [expanded, visibleNodes, visible],
  );

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <ActionButton
          icon="plus-alt"
          onClick={() => onExpandAll(visibleNodes)}
          disabled={expandable === 0}
          title={expandable === 0 ? t('actions.nothingToExpand') : undefined}
        >
          {t('actions.expandVisible', { count: expandable })}
        </ActionButton>
        <ActionButton icon="repeat" onClick={onReload} disabled={refreshing}>
          {refreshing ? t('actions.refreshing') : t('actions.refresh')}
        </ActionButton>
        {pinnedCount > 0 && (
          <ActionButton icon="locked" onClick={onReleasePins}>
            {t('controls.releasePins', { count: pinnedCount })}
          </ActionButton>
        )}
        {filtersActive && (
          <ActionButton icon="x" onClick={onResetFilters}>
            {t('filters.reset')}
          </ActionButton>
        )}
      </div>

      <Section label={t('filters.show')}>
        <TypeFilter visibleTypes={visibleTypes} onToggle={onToggleType} />
      </Section>

      <Section label={t('lens.label')}>
        <div className="flex flex-wrap gap-1.5">
          {LENS_KEYS.map((key) => (
            <ToggleChip key={key} active={lenses[key]} onToggle={() => onToggleLens(key)}>
              {t(LENS_LABELS[key])}
            </ToggleChip>
          ))}
        </div>
      </Section>

      {timeBounds && (
        <Section label={t('time.section')}>
          <AddedSinceFilter
            min={timeBounds.min}
            max={timeBounds.max}
            since={since}
            onChange={onSinceChange}
          />
        </Section>
      )}
    </div>
  );
};

export default memo(ViewTab);
