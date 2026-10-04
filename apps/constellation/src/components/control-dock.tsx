import { t } from '../i18n';
import { cn } from '@shared/lib';
import { usePersistentState } from '@shared/hooks';
import { FOCUS_RING, PANEL_SURFACE } from '@ui/styles';
import type { SweepProgress } from '../hooks/use-expand-all';
import React, { useRef, createContext, type ReactNode } from 'react';
import {
  IconButton,
  ActionButton,
  type Segment,
  SpicetifyIcon,
  SegmentedTabs,
} from '@ui/components';

const TAB_IDS = ['view', 'physics', 'nodes'] as const;
type TabId = (typeof TAB_IDS)[number];

const panelId = (id: TabId) => `dock-panel-${id}`;

/** Panels stay mounted to keep their state, so each one gates its own work on being shown. */
export const PanelVisible = createContext(true);

type Props = {
  nodeCount: number;
  linkCount: number;
  progress: SweepProgress | null;
  onCancelExpandAll: () => void;
  view: ReactNode;
  physics: ReactNode;
  nodes: ReactNode;
};

const SweepStatus = ({ progress, onCancel }: { progress: SweepProgress; onCancel: () => void }) => (
  <div className="flex items-center gap-2">
    <span role="status" className="text-xs tabular-nums text-spice-subtext">
      {t('actions.expanding', { done: progress.done, total: progress.total })}
    </span>
    <ActionButton icon="x" onClick={onCancel}>
      {t('actions.cancel')}
    </ActionButton>
  </div>
);

const ControlDock = ({ nodeCount, linkCount, progress, onCancelExpandAll, ...panels }: Props) => {
  const [collapsed, setCollapsed] = usePersistentState('dockCollapsed', false);
  const [tab, setTab] = usePersistentState<TabId>('dockTab', 'view');
  const segments: Segment<TabId>[] = TAB_IDS.map((id) => ({ id, label: t(`dock.${id}`) }));

  const expandRef = useRef<HTMLButtonElement>(null);
  const collapseRef = useRef<HTMLButtonElement>(null);
  // the clicked toggle hides itself, so focus follows to its counterpart
  const toggle = (next: boolean) => {
    setCollapsed(next);
    requestAnimationFrame(() => (next ? expandRef : collapseRef).current?.focus());
  };
  const sweep = progress && <SweepStatus progress={progress} onCancel={onCancelExpandAll} />;

  return (
    <>
      <div
        className={cn(
          'flex flex-col gap-2 self-start',
          progress && 'w-full',
          !collapsed && 'hidden',
        )}
      >
        <button
          ref={expandRef}
          type="button"
          aria-expanded={false}
          onClick={() => toggle(false)}
          className={cn(
            'flex items-center gap-2 self-start px-3 py-2 text-xs font-medium text-spice-text',
            PANEL_SURFACE,
            FOCUS_RING,
          )}
        >
          <SpicetifyIcon icon="list-view" size={14} />
          {t('dock.title')}
        </button>
        {collapsed && sweep && <div className={cn('px-3 py-2', PANEL_SURFACE)}>{sweep}</div>}
      </div>

      <div className={cn('flex min-h-0 flex-1 flex-col', PANEL_SURFACE, collapsed && 'hidden')}>
        <div className="flex shrink-0 items-center justify-between gap-2 px-3.5 pb-2.5 pt-3">
          <span className="text-xs font-medium tabular-nums text-spice-subtext">
            {t('scale.summary', { nodes: nodeCount, links: linkCount })}
          </span>
          <IconButton
            ref={collapseRef}
            icon="minimize"
            label={t('panel.hide')}
            aria-expanded
            onClick={() => toggle(true)}
            size={13}
            className="size-7"
          />
        </div>

        {!collapsed && sweep && <div className="shrink-0 px-3.5 pb-2.5">{sweep}</div>}

        <div className="shrink-0 px-3.5 pb-3">
          <SegmentedTabs
            segments={segments}
            active={tab}
            onChange={setTab}
            panelId={panelId}
            label={t('dock.title')}
          />
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
              <PanelVisible.Provider value={!collapsed && tab === id}>
                {panels[id]}
              </PanelVisible.Provider>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ControlDock;
