import React from 'react';
import { t } from '../i18n';
import TypeFilter from './type-filter';
import type { GraphNode } from '../types';
import AddToGraphBox from './add-to-graph-box';
import AddedSinceFilter from './added-since-filter';
import type { MusicGraph } from '../graph/music-graph';
import { usePersistentState } from '../hooks/use-persistent-state';
import type { useGraphControls } from '../hooks/use-graph-controls';
import { ToggleChip, SpicetifyIcon, IconButton } from '@ui/components';
import { PANEL_SURFACE, FOCUS_RING, ACTION_BUTTON, SECTION_LABEL } from './chrome-styles';

type GraphControls = ReturnType<typeof useGraphControls>;

type Props = {
  graph: MusicGraph;
  controls: GraphControls;
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

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <span className={SECTION_LABEL}>{label}</span>
    {children}
  </div>
);

const ControlPanel = ({
  graph,
  controls,
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

  if (collapsed)
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className={`animate-fade-in-up flex items-center gap-2 self-start px-3 py-2 text-xs font-medium text-spice-text ${PANEL_SURFACE} ${FOCUS_RING}`}
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
    {
      label: t('lens.connected'),
      active: controls.showHubsOnly,
      onToggle: controls.toggleHubsOnly,
    },
  ];

  const hasActions = pinnedCount > 0 || !controls.allTypesVisible;

  return (
    <div
      className={`animate-fade-in-up flex max-h-[calc(100vh-7rem)] flex-col gap-3.5 overflow-y-auto p-3.5 ${PANEL_SURFACE}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium tabular-nums text-spice-subtext">
          {t('scale.summary', { nodes: graph.size, links: graph.linkCount })}
        </span>
        <IconButton
          icon="minimize"
          label={t('panel.hide')}
          onClick={() => setCollapsed(true)}
          size={13}
          className="h-7 w-7"
        />
      </div>

      {hasActions && (
        <div className="flex flex-wrap items-center gap-1.5">
          {pinnedCount > 0 && (
            <button type="button" onClick={onReleasePins} className={ACTION_BUTTON}>
              <SpicetifyIcon icon="locked" size={11} />
              {t('controls.releasePins', { count: pinnedCount })}
            </button>
          )}
          {!controls.allTypesVisible && (
            <button type="button" onClick={controls.showAllTypes} className={ACTION_BUTTON}>
              <SpicetifyIcon icon="x" size={11} />
              {t('filters.reset')}
            </button>
          )}
        </div>
      )}

      <div className="h-px bg-spice-subtext/10" />
      <AddToGraphBox adding={adding} onAdd={onAdd} onAdded={onAdded} />

      {expandProgress ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs tabular-nums text-spice-subtext">
            {t('actions.expanding', { done: expandProgress.done, total: expandProgress.total })}
          </span>
          <button type="button" onClick={onCancelExpandAll} className={ACTION_BUTTON}>
            <SpicetifyIcon icon="x" size={11} />
            {t('actions.cancel')}
          </button>
        </div>
      ) : (
        <button type="button" onClick={onExpandAll} className={`self-start ${ACTION_BUTTON}`}>
          <SpicetifyIcon icon="plus-alt" size={12} />
          {t('actions.expandAll')}
        </button>
      )}

      <Section label={t('filters.show')}>
        <TypeFilter visibleTypes={controls.visibleTypes} onToggle={controls.toggleType} />
      </Section>

      <Section label={t('lens.label')}>
        <div className="flex flex-wrap gap-1.5">
          {lenses.map((lens) => (
            <ToggleChip key={lens.label} active={lens.active} onToggle={lens.onToggle}>
              {lens.label}
            </ToggleChip>
          ))}
        </div>
      </Section>

      {timeBounds && (
        <Section label={t('time.section')}>
          <AddedSinceFilter
            min={timeBounds.min}
            max={timeBounds.max}
            since={controls.since}
            onChange={controls.setSince}
          />
        </Section>
      )}
    </div>
  );
};

export default ControlPanel;
