import { t } from '../i18n';
import TypeFilter from './type-filter';
import React, { useMemo } from 'react';
import type { GraphNode } from '../types';
import AddToGraphBox from './add-to-graph-box';
import { userCount } from '../graph/shared-nodes';
import AddedSinceFilter from './added-since-filter';
import type { MusicGraph } from '../graph/music-graph';
import { ToggleChip, SpicetifyIcon } from '@ui/components';
import { PANEL_SURFACE, FOCUS_RING } from './chrome-styles';
import { usePersistentState } from '../hooks/use-persistent-state';
import type { useGraphControls } from '../hooks/use-graph-controls';

type GraphControls = ReturnType<typeof useGraphControls>;

type Props = {
  graph: MusicGraph;
  controls: GraphControls;
  revision: number;
  timeBounds: { min: number; max: number } | null;
  adding: boolean;
  pinnedCount: number;
  expandProgress: { done: number; total: number } | null;
  onAdd: (input: string) => Promise<GraphNode | null>;
  onAdded: (node: GraphNode) => void;
  onExpandAll: () => void;
  onCancelExpandAll: () => void;
  onReleasePins: () => void;
};

const chipButton = `flex items-center gap-1 rounded-md border border-spice-subtext/25 px-2 py-0.5 text-[11px] font-medium text-spice-subtext transition-colors hover:border-spice-subtext/50 hover:bg-spice-highlight/15 hover:text-spice-text ${FOCUS_RING}`;

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[11px] font-semibold uppercase tracking-wider text-spice-subtext/70">
    {children}
  </span>
);

const ControlPanel = ({
  graph,
  controls,
  revision,
  timeBounds,
  adding,
  pinnedCount,
  expandProgress,
  onAdd,
  onAdded,
  onExpandAll,
  onCancelExpandAll,
  onReleasePins,
}: Props) => {
  const [collapsed, setCollapsed] = usePersistentState('controlsCollapsed', false);
  const hasMultipleUsers = useMemo(() => userCount(graph) >= 2, [graph, revision]);

  if (collapsed)
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className={`animate-fade-in-up flex items-center gap-1.5 self-start px-3 py-2 text-xs font-medium text-spice-text ${PANEL_SURFACE} ${FOCUS_RING}`}
      >
        <SpicetifyIcon icon="list-view" size={14} />
        {t('panel.show')}
      </button>
    );

  const lenses = [
    { label: t('lens.byDegree'), active: controls.sizeByDegree, onToggle: controls.toggleSizeLens },
    {
      label: t('lens.byCluster'),
      active: controls.colorByCluster,
      onToggle: controls.toggleClusterLens,
    },
    {
      label: t('edges.collaborations'),
      active: controls.showCollaborations,
      onToggle: controls.toggleCollaborations,
    },
  ];
  if (hasMultipleUsers)
    lenses.push({
      label: t('lens.common'),
      active: controls.showCommonOnly,
      onToggle: controls.toggleCommonOnly,
    });

  return (
    <div className={`animate-fade-in-up flex flex-col gap-3.5 p-3.5 ${PANEL_SURFACE}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-spice-subtext">
          {t('scale.summary', { nodes: graph.size, links: graph.linkCount })}
        </span>
        <div className="flex items-center gap-1.5">
          {pinnedCount > 0 && (
            <button type="button" onClick={onReleasePins} className={chipButton}>
              <SpicetifyIcon icon="locked" size={11} />
              {t('controls.releasePins', { count: pinnedCount })}
            </button>
          )}
          {!controls.allTypesVisible && (
            <button type="button" onClick={controls.showAllTypes} className={chipButton}>
              <SpicetifyIcon icon="x" size={11} />
              {t('filters.reset')}
            </button>
          )}
          <button
            type="button"
            aria-label={t('panel.hide')}
            onClick={() => setCollapsed(true)}
            className={`flex h-6 w-6 items-center justify-center rounded-md text-spice-subtext transition-colors hover:bg-spice-highlight/25 hover:text-spice-text ${FOCUS_RING}`}
          >
            <SpicetifyIcon icon="minimize" size={13} />
          </button>
        </div>
      </div>

      <div className="h-px bg-spice-subtext/10" />
      <AddToGraphBox adding={adding} onAdd={onAdd} onAdded={onAdded} />

      {expandProgress ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-spice-subtext">
            {t('actions.expanding', { done: expandProgress.done, total: expandProgress.total })}
          </span>
          <button type="button" onClick={onCancelExpandAll} className={chipButton}>
            <SpicetifyIcon icon="x" size={11} />
            {t('actions.cancel')}
          </button>
        </div>
      ) : (
        <button type="button" onClick={onExpandAll} className={`self-start ${chipButton}`}>
          <SpicetifyIcon icon="plus-alt" size={12} />
          {t('actions.expandAll')}
        </button>
      )}

      <div className="flex flex-col gap-2">
        <SectionLabel>{t('filters.show')}</SectionLabel>
        <TypeFilter visibleTypes={controls.visibleTypes} onToggle={controls.toggleType} />
      </div>

      <div className="flex flex-col gap-2">
        <SectionLabel>{t('lens.label')}</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {lenses.map((lens) => (
            <ToggleChip key={lens.label} active={lens.active} onToggle={lens.onToggle}>
              {lens.label}
            </ToggleChip>
          ))}
        </div>
      </div>

      {timeBounds && (
        <div className="flex flex-col gap-2">
          <SectionLabel>{t('time.section')}</SectionLabel>
          <AddedSinceFilter
            min={timeBounds.min}
            max={timeBounds.max}
            since={controls.since}
            onChange={controls.setSince}
          />
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
