import { t } from '../i18n';
import TypeFilter from './type-filter';
import { PanelVisible } from './control-dock';
import type { GraphNode } from '../types/graph';
import React, { useMemo, useContext } from 'react';
import AddedSinceFilter from './added-since-filter';
import type { TimeBounds } from '../graph/node-query';
import { expandableNodes } from '../hooks/use-expand-all';
import { ToggleChip, SpicetifyIcon } from '@ui/components';
import { ACTION_BUTTON, SECTION_LABEL } from '../styles/chrome';
import type { LibraryGraph } from '../services/library-crawler';
import type { GraphControls } from '../hooks/use-graph-controls';

type Props = {
  controls: GraphControls;
  library: LibraryGraph;
  timeBounds: TimeBounds | null;
  since: number;
  pinnedCount: number;
  visibleNodes: GraphNode[];
  filtersActive: boolean;
  onResetFilters: () => void;
  onExpandAll: () => void;
  onReleasePins: () => void;
  onReload: () => void;
  refreshing: boolean;
};

const LENS_KEYS = [
  ['lens.byDegree', 'sizeByDegree', 'toggleSizeLens'],
  ['lens.byCluster', 'colorByCluster', 'toggleClusterLens'],
  ['edges.collaborations', 'showCollaborations', 'toggleCollaborations'],
  ['lens.connected', 'connectedOnly', 'toggleConnectedOnly'],
] as const;

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <span className={SECTION_LABEL}>{label}</span>
    {children}
  </div>
);

const ViewTab = ({
  controls,
  library,
  timeBounds,
  since,
  pinnedCount,
  visibleNodes,
  filtersActive,
  onResetFilters,
  onExpandAll,
  onReleasePins,
  onReload,
  refreshing,
}: Props) => {
  const visible = useContext(PanelVisible);
  const expandable = useMemo(
    () => (visible ? expandableNodes(library, visibleNodes).length : 0),
    [library, visibleNodes, visible],
  );

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={onExpandAll}
          disabled={expandable === 0}
          title={expandable === 0 ? t('actions.nothingToExpand') : undefined}
          className={ACTION_BUTTON}
        >
          <SpicetifyIcon icon="plus-alt" size={12} />
          {t('actions.expandVisible', { count: expandable })}
        </button>
        <button type="button" onClick={onReload} disabled={refreshing} className={ACTION_BUTTON}>
          <SpicetifyIcon icon="repeat" size={11} />
          {refreshing ? t('actions.refreshing') : t('actions.refresh')}
        </button>
        {pinnedCount > 0 && (
          <button type="button" onClick={onReleasePins} className={ACTION_BUTTON}>
            <SpicetifyIcon icon="locked" size={11} />
            {t('controls.releasePins', { count: pinnedCount })}
          </button>
        )}
        {filtersActive && (
          <button type="button" onClick={onResetFilters} className={ACTION_BUTTON}>
            <SpicetifyIcon icon="x" size={11} />
            {t('filters.reset')}
          </button>
        )}
      </div>

      <Section label={t('filters.show')}>
        <TypeFilter visibleTypes={controls.visibleTypes} onToggle={controls.toggleType} />
      </Section>

      <Section label={t('lens.label')}>
        <div className="flex flex-wrap gap-1.5">
          {LENS_KEYS.map(([labelKey, flag, toggle]) => (
            <ToggleChip key={labelKey} active={controls[flag]} onToggle={controls[toggle]}>
              {t(labelKey)}
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
            onChange={controls.setSince}
          />
        </Section>
      )}
    </div>
  );
};

export default ViewTab;
