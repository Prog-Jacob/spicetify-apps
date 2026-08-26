import { t } from '../i18n';
import { cn } from '@shared/lib';
import React, { useMemo } from 'react';
import { NODE_TYPE } from '../constants';
import NodeTypeDot from './node-type-dot';
import { monogram } from '../graph/node-style';
import { useGraphPalette } from '../graph/theme';
import { canExpand } from '../services/expand-node';
import type { NodeType, GraphNode } from '../types';
import type { MusicGraph } from '../graph/music-graph';
import { queueTrack } from '../services/spotify-actions';
import { toDateString, openUriInClient } from '@shared/lib';
import { FOCUS_RING, FOCUS_RING_INSET } from './chrome-styles';
import { TextComponent, ButtonPrimary, ButtonSecondary, SpicetifyIcon } from '@ui/components';

const PLAYABLE = new Set<NodeType>([
  NODE_TYPE.TRACK,
  NODE_TYPE.ARTIST,
  NODE_TYPE.ALBUM,
  NODE_TYPE.PLAYLIST,
]);

type Props = {
  node: GraphNode;
  graph: MusicGraph;
  revision: number;
  images: Map<string, string>;
  expanded: Set<string>;
  expandingUri: string | null;
  focused: boolean;
  pinned: boolean;
  onExpand: (node: GraphNode) => void;
  onFocus: (node: GraphNode) => void;
  onSelect: (node: GraphNode) => void;
  onClearFocus: () => void;
  onUnpin: () => void;
  onClose: () => void;
};

const NodeAvatar = ({ node, image }: { node: GraphNode; image?: string }) => {
  const palette = useGraphPalette();
  if (image)
    return (
      <img src={image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover shadow-md" />
    );
  return (
    <span
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg font-semibold text-white shadow-md"
      style={{ backgroundColor: palette.color[node.type] }}
    >
      {monogram(node.label)}
    </span>
  );
};

const ActionButton = ({
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
    <Button buttonSize="sm" onClick={onClick} disabled={disabled}>
      <span className="flex items-center gap-1.5">
        <SpicetifyIcon icon={icon} size={14} />
        {label}
      </span>
    </Button>
  );
};

const Inspector = ({
  node,
  graph,
  revision,
  images,
  expanded,
  expandingUri,
  focused,
  pinned,
  onExpand,
  onFocus,
  onSelect,
  onClearFocus,
  onUnpin,
  onClose,
}: Props) => {
  const neighbors = useMemo(() => graph.neighbors(node.uri), [graph, node, revision]);
  const breakdown = useMemo(() => {
    const counts = new Map<NodeType, number>();
    for (const n of neighbors) counts.set(n.type, (counts.get(n.type) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1]);
  }, [neighbors]);
  const playable = PLAYABLE.has(node.type);

  return (
    <aside className="animate-fade-in-up relative z-20 flex h-full w-80 shrink-0 flex-col overflow-y-auto border-s border-spice-subtext/15 bg-spice-card/85 backdrop-blur-md">
      <header className="flex items-center justify-between gap-2 border-b border-spice-subtext/10 px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-spice-subtext">
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
          <button
            type="button"
            aria-label={t('inspector.close')}
            onClick={onClose}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-md text-spice-subtext transition-colors hover:bg-spice-highlight/25 hover:text-spice-text',
              FOCUS_RING,
            )}
          >
            <SpicetifyIcon icon="x" size={14} />
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-start gap-3">
          <NodeAvatar node={node} image={images.get(node.uri)} />
          <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
            <TextComponent variant="alto" weight="bold">
              {node.label}
            </TextComponent>
            {node.addedAt && (
              <TextComponent variant="minuet" semanticColor="textSubdued">
                {t('inspector.saved', { date: toDateString(node.addedAt) })}
              </TextComponent>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {playable && (
            <ActionButton
              primary
              icon="play"
              label={t('inspector.play')}
              onClick={() => Spicetify.Player.playUri(node.uri)}
            />
          )}
          {node.type === NODE_TYPE.TRACK && (
            <ActionButton
              icon="queue"
              label={t('inspector.queue')}
              onClick={() => queueTrack(node.uri)}
            />
          )}
          {playable && (
            <ActionButton
              icon="external-link"
              label={t('inspector.open')}
              onClick={() => openUriInClient(node.uri)}
            />
          )}
          {canExpand(node.type) && !expanded.has(node.uri) && (
            <ActionButton
              icon="plus-alt"
              label={expandingUri === node.uri ? t('inspector.expanding') : t('inspector.expand')}
              onClick={() => onExpand(node)}
              disabled={expandingUri === node.uri}
            />
          )}
          {neighbors.length > 0 && (
            <ActionButton
              icon="location"
              label={t('inspector.focus')}
              onClick={() => onFocus(node)}
            />
          )}
          {pinned && <ActionButton icon="locked" label={t('inspector.unpin')} onClick={onUnpin} />}
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
                  {count} {t(`type.${type}`)}
                </span>
              ))}
            </div>
          )}
        </div>

        <ul className="flex flex-col gap-px">
          {neighbors.map((n) => (
            <li key={n.uri}>
              <button
                type="button"
                onClick={() => onSelect(n)}
                className={cn(
                  'group flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-start transition-colors',
                  'hover:bg-spice-highlight/25',
                  FOCUS_RING_INSET,
                )}
              >
                <NodeTypeDot type={n.type} />
                <span className="truncate text-sm text-spice-text">{n.label}</span>
                <SpicetifyIcon
                  icon="chevron-right"
                  size={12}
                  className="ms-auto shrink-0 text-spice-subtext opacity-0 transition-opacity group-hover:opacity-100"
                />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Inspector;
