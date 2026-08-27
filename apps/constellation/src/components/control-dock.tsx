import React from 'react';
import { t } from '../i18n';
import { cn } from '@shared/lib';
import PhysicsTab from './physics-tab';
import type { MusicGraph } from '../graph/music-graph';
import type { usePhysics } from '../hooks/use-physics';
import ViewTab, { type ViewTabProps } from './view-tab';
import NodesTab, { type NodesTabProps } from './nodes-tab';
import { IconButton, SpicetifyIcon } from '@ui/components';
import { PANEL_SURFACE, FOCUS_RING } from './chrome-styles';
import SegmentedTabs, { type Segment } from './segmented-tabs';
import { usePersistentState } from '../hooks/use-persistent-state';

type TabId = 'view' | 'physics' | 'nodes';

const SEGMENTS: Segment<TabId>[] = [
  { id: 'view', label: t('dock.view') },
  { id: 'physics', label: t('dock.physics') },
  { id: 'nodes', label: t('dock.nodes') },
];

type Props = {
  graph: MusicGraph;
  view: ViewTabProps;
  physics: ReturnType<typeof usePhysics>;
  nodes: NodesTabProps;
};

const ControlDock = ({ graph, view, physics, nodes }: Props) => {
  const [collapsed, setCollapsed] = usePersistentState('dockCollapsed', false);
  const [tab, setTab] = usePersistentState<TabId>('dockTab', 'view');

  if (collapsed)
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className={cn(
          'animate-fade-in-up flex items-center gap-2 self-start px-3 py-2 text-xs font-medium text-spice-text',
          PANEL_SURFACE,
          FOCUS_RING,
        )}
      >
        <SpicetifyIcon icon="list-view" size={14} />
        {t('dock.title')}
      </button>
    );

  return (
    <div className={cn('animate-fade-in-up flex min-h-0 flex-1 flex-col', PANEL_SURFACE)}>
      <div className="flex shrink-0 items-center justify-between gap-2 px-3.5 pb-2.5 pt-3">
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

      <div className="shrink-0 px-3.5 pb-3">
        <SegmentedTabs segments={SEGMENTS} active={tab} onChange={setTab} />
      </div>

      <div role="tabpanel" className="min-h-0 flex-1 overflow-y-auto px-3.5 pb-3.5">
        {tab === 'view' && <ViewTab {...view} />}
        {tab === 'physics' && <PhysicsTab physics={physics} />}
        {tab === 'nodes' && <NodesTab {...nodes} />}
      </div>
    </div>
  );
};

export default ControlDock;
