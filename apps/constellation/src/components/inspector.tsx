import { t } from '../i18n';
import NodeRow from './node-row';
import { NODE_TYPE } from '../constants';
import NodeTypeDot from './node-type-dot';
import { monogram } from '../graph/node-style';
import { RemoveMenu } from './remove-type-menu';
import { cn, openUriInClient } from '@shared/lib';
import { FOCUS_RING, PANEL_SURFACE } from '@ui/styles';
import type { GraphView } from '../hooks/use-graph-view';
import type { NodeType, GraphNode } from '../types/graph';
import { useGraphPalette } from '../hooks/use-graph-palette';
import React, { memo, useMemo, useRef, useEffect } from 'react';
import {
  Artwork,
  IconButton,
  TextComponent,
  ButtonPrimary,
  SpicetifyIcon,
  ButtonSecondary,
} from '@ui/components';

const NEIGHBOR_CAP = 120;

const PLAYABLE = new Set<NodeType>([
  NODE_TYPE.TRACK,
  NODE_TYPE.ARTIST,
  NODE_TYPE.ALBUM,
  NODE_TYPE.PLAYLIST,
]);

const ROUND = new Set<NodeType>([NODE_TYPE.USER, NODE_TYPE.ARTIST]);

type Props = {
  node: GraphNode;
  view: GraphView;
  image?: string;
  expandable: boolean;
  expanding: boolean;
  focused: boolean;
  pinned: boolean;
  marked: boolean;
  /** False for your own node, which roots the graph. */
  removable: boolean;
  onExpand: (node: GraphNode) => void;
  onFocus: (node: GraphNode) => void;
  onSelect: (node: GraphNode) => void;
  onToggleMark: (node: GraphNode) => void;
  onClearFocus: () => void;
  onUnpin: (node: GraphNode) => void;
  onRemove: (node: GraphNode, keep: ReadonlySet<NodeType>) => void;
  onClose: () => void;
};

const NodeAvatar = ({ node, image }: { node: GraphNode; image?: string }) => {
  const palette = useGraphPalette();
  return (
    <Artwork
      src={image}
      size={48}
      shape={ROUND.has(node.type) ? 'circle' : 'square'}
      className="shadow-md"
      fallback={
        <span
          className="flex size-full items-center justify-center text-lg font-semibold"
          style={{ backgroundColor: palette.color[node.type], color: palette.text }}
        >
          {monogram(node.label)}
        </span>
      }
    />
  );
};

const PanelButton = ({
  icon,
  label,
  onClick,
  disabled,
  primary,
}: {
  icon: Spicetify.Icon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) => {
  const Button = primary ? ButtonPrimary : ButtonSecondary;
  return (
    <Button
      buttonSize="sm"
      iconLeading={() => <SpicetifyIcon icon={icon} size={14} />}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </Button>
  );
};

const NeighborList = memo(
  ({ neighbors, onSelect }: { neighbors: GraphNode[]; onSelect: (node: GraphNode) => void }) => {
    const shown = neighbors.slice(0, NEIGHBOR_CAP);
    const overflow = neighbors.length - shown.length;
    return (
      <>
        <ul className="flex flex-col gap-0.5">
          {shown.map((n) => (
            <NodeRow
              key={n.uri}
              type={n.type}
              label={n.label}
              revealTag
              onSelect={() => onSelect(n)}
            />
          ))}
        </ul>
        {overflow > 0 && (
          <TextComponent variant="minuet" semanticColor="textSubdued">
            {t('inspector.moreConnections', { count: overflow })}
          </TextComponent>
        )}
      </>
    );
  },
);
NeighborList.displayName = 'NeighborList';

const Inspector = ({
  node,
  view,
  image,
  expandable,
  expanding,
  focused,
  pinned,
  marked,
  removable,
  onExpand,
  onFocus,
  onSelect,
  onToggleMark,
  onClearFocus,
  onUnpin,
  onRemove,
  onClose,
}: Props) => {
  const neighbors = useMemo(() => view.graph.neighbors(node.uri), [view, node]);
  const breakdown = useMemo(() => {
    const counts = new Map<NodeType, number>();
    for (const n of neighbors) counts.set(n.type, (counts.get(n.type) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1]);
  }, [neighbors]);
  const playable = PLAYABLE.has(node.type);
  const panelRef = useRef<HTMLElement>(null);
  const openedFrom = useRef<Element | null>(null);

  useEffect(() => {
    openedFrom.current = document.activeElement;
    return () => {
      const origin = openedFrom.current;
      if (origin instanceof HTMLElement && origin.isConnected)
        origin.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (!panelRef.current?.contains(document.activeElement))
      panelRef.current?.focus({ preventScroll: true });
  }, [node.uri]);

  return (
    <aside
      ref={panelRef}
      tabIndex={-1}
      aria-label={node.label}
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return;
        e.stopPropagation();
        onClose();
      }}
      className={cn(
        'animate-fade-in-up absolute bottom-16 end-3 top-14 z-20 flex w-80 flex-col overflow-hidden',
        PANEL_SURFACE,
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-spice-subtext/10 px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-spice-subtext">
          <NodeTypeDot type={node.type} className="h-2 w-2" />
          {t(`type.${node.type}`)}
        </span>
        <div className="flex items-center gap-1">
          {focused && (
            <button
              type="button"
              onClick={onClearFocus}
              className={cn(
                'flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-spice-subtext transition-colors hover:text-spice-text',
                FOCUS_RING,
              )}
            >
              <SpicetifyIcon icon="x" size={11} />
              {t('inspector.clearFocus')}
            </button>
          )}
          <IconButton
            icon="x"
            label={t('inspector.close')}
            onClick={onClose}
            size={14}
            className="size-7"
          />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 [mask-image:linear-gradient(to_bottom,transparent,#000_16px,#000_calc(100%-16px),transparent)]">
        <div className="flex items-start gap-3">
          <NodeAvatar node={node} image={image} />
          <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
            <TextComponent as="h2" variant="alto" weight="bold">
              {node.label}
            </TextComponent>
            {node.addedAt && (
              <TextComponent variant="minuet" semanticColor="textSubdued">
                {t('inspector.saved', { date: t.date(node.addedAt) })}
              </TextComponent>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {playable && (
            <PanelButton
              primary
              icon="play"
              label={t('inspector.play')}
              onClick={() => void Spicetify.Player.playUri(node.uri)}
            />
          )}
          {node.type === NODE_TYPE.TRACK && (
            <PanelButton
              icon="queue"
              label={t('inspector.queue')}
              onClick={() =>
                void Spicetify.addToQueue([{ uri: node.uri }] as Spicetify.ContextTrack[])
              }
            />
          )}
          {playable && (
            <PanelButton
              icon="external-link"
              label={t('inspector.open')}
              onClick={() => openUriInClient(node.uri)}
            />
          )}
          {expandable && (
            <PanelButton
              icon="plus-alt"
              label={expanding ? t('inspector.expanding') : t('inspector.expand')}
              onClick={() => onExpand(node)}
              disabled={expanding}
            />
          )}
          {neighbors.length > 0 && (
            <PanelButton
              icon="location"
              label={t('inspector.focus')}
              onClick={() => onFocus(node)}
            />
          )}
          <PanelButton
            icon={marked ? 'check' : 'plus2px'}
            label={marked ? t('inspector.unmark') : t('inspector.mark')}
            onClick={() => onToggleMark(node)}
          />
          {pinned && (
            <PanelButton icon="locked" label={t('inspector.unpin')} onClick={() => onUnpin(node)} />
          )}
          {removable && (
            <RemoveMenu
              types={breakdown.map(([type]) => type)}
              onRemove={(keep) => onRemove(node, keep)}
            />
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-spice-subtext/10 pt-3">
          <span className="text-xs font-semibold text-spice-text">
            {t('inspector.connections', { count: neighbors.length })}
          </span>
          {breakdown.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {breakdown.map(([type, count]) => (
                <span key={type} className="flex items-center gap-1.5 text-xs text-spice-subtext">
                  <NodeTypeDot type={type} className="h-2 w-2" />
                  {t(`count.${type}`, { count })}
                </span>
              ))}
            </div>
          )}
        </div>

        <NeighborList neighbors={neighbors} onSelect={onSelect} />
      </div>
    </aside>
  );
};

export default memo(Inspector);
