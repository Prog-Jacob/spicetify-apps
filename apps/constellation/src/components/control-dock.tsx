import { t } from '../i18n';
import { cn } from '@shared/lib';
import { FOCUS_RING } from '@ui/styles/surfaces';
import { usePersistentState } from '@shared/hooks';
import type { MusicGraph } from '../graph/music-graph';
import type { SweepProgress } from '../hooks/use-expand-all';
import React, { createContext, type ReactNode } from 'react';
import { PANEL_SURFACE, ACTION_BUTTON } from '../styles/chrome';
import { IconButton, SpicetifyIcon, SegmentedTabs, type Segment } from '@ui/components';

const TAB_IDS = ['view', 'physics', 'nodes'] as const;
type TabId = (typeof TAB_IDS)[number];

const panelId = (id: TabId) => `dock-panel-${id}`;

/** Panels stay mounted to keep their state, so each one gates its own work on being shown. */
export const PanelVisible = createContext(true);

type Props = {
  graph: MusicGraph;
  progress: SweepProgress | null;
  onCancelExpandAll: () => void;
  view: ReactNode;
  physics: ReactNode;
  nodes: ReactNode;
};

const SweepStatus = ({ progress, onCancel }: { progress: SweepProgress; onCancel: () => void }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs tabular-nums text-spice-subtext">
      {t('actions.expanding', { done: progress.done, total: progress.total })}
    </span>
    <button type="button" onClick={onCancel} className={ACTION_BUTTON}>
      <SpicetifyIcon icon="x" size={11} />
      {t('actions.cancel')}
    </button>
  </div>
);

const ControlDock = ({ graph, progress, onCancelExpandAll, ...panels }: Props) => {
  const [collapsed, setCollapsed] = usePersistentState('dockCollapsed', false);
  const [tab, setTab] = usePersistentState<TabId>('dockTab', 'view');
  const segments: Segment<TabId>[] = TAB_IDS.map((id) => ({ id, label: t(`dock.${id}`) }));

  if (collapsed)
    return (
      <div className={cn('flex flex-col gap-2 self-start', progress && 'w-full')}>
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className={cn(
            'flex items-center gap-2 self-start px-3 py-2 text-xs font-medium text-spice-text',
            PANEL_SURFACE,
            FOCUS_RING,
          )}
        >
          <SpicetifyIcon icon="list-view" size={14} />
          {t('dock.title')}
        </button>
        {progress && (
          <div className={cn('px-3 py-2', PANEL_SURFACE)}>
            <SweepStatus progress={progress} onCancel={onCancelExpandAll} />
          </div>
        )}
      </div>
    );

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', PANEL_SURFACE)}>
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

      {progress && (
        <div className="shrink-0 px-3.5 pb-2.5">
          <SweepStatus progress={progress} onCancel={onCancelExpandAll} />
        </div>
      )}

      <div className="shrink-0 px-3.5 pb-3">
        <SegmentedTabs segments={segments} active={tab} onChange={setTab} panelId={panelId} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {TAB_IDS.map((id) => (
          <div
            key={id}
            id={panelId(id)}
            role="tabpanel"
            aria-labelledby={`${panelId(id)}-tab`}
            hidden={tab !== id}
            className="min-h-0 flex-1 overflow-y-auto px-3.5 pb-3.5"
          >
            <PanelVisible.Provider value={tab === id}>{panels[id]}</PanelVisible.Provider>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ControlDock;
