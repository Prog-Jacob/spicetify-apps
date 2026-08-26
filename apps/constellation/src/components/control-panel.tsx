import React from 'react';
import { t } from '../i18n';
import TypeFilter from './type-filter';
import type { GraphNode } from '../types';
import AddToGraphBox from './add-to-graph-box';
import AddedSinceFilter from './added-since-filter';
import type { MusicGraph } from '../graph/music-graph';
import { ToggleChip, SpicetifyIcon } from '@ui/components';
import { PANEL_SURFACE, FOCUS_RING } from './chrome-styles';
import type { useGraphControls } from '../hooks/use-graph-controls';

type GraphControls = ReturnType<typeof useGraphControls>;

type Props = {
  graph: MusicGraph;
  controls: GraphControls;
  timeBounds: { min: number; max: number } | null;
  adding: boolean;
  onAdd: (input: string) => Promise<GraphNode | null>;
  onAdded: (node: GraphNode) => void;
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[11px] font-semibold uppercase tracking-wider text-spice-subtext/70">
    {children}
  </span>
);

const ControlPanel = ({ graph, controls, timeBounds, adding, onAdd, onAdded }: Props) => {
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

  return (
    <div className={`flex flex-col gap-3.5 p-3.5 ${PANEL_SURFACE}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-spice-subtext">
          {t('scale.summary', { nodes: graph.size, links: graph.linkCount })}
        </span>
        {!controls.allTypesVisible && (
          <button
            type="button"
            onClick={controls.showAllTypes}
            className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-spice-subtext transition-colors hover:text-spice-text ${FOCUS_RING}`}
          >
            <SpicetifyIcon icon="x" size={11} />
            {t('filters.reset')}
          </button>
        )}
      </div>

      <div className="h-px bg-spice-subtext/10" />
      <AddToGraphBox adding={adding} onAdd={onAdd} onAdded={onAdded} />

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
