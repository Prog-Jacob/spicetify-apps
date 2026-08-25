import { t } from '../i18n';
import React, { useMemo } from 'react';
import { NODE_TYPE } from '../constants';
import NodeTypeDot from './node-type-dot';
import type { NodeType, GraphNode } from '../types';
import { canExpand } from '../services/expand-node';
import type { MusicGraph } from '../graph/music-graph';
import { TextComponent, ButtonSecondary } from '@ui/components';

const PLAYABLE = new Set<NodeType>([
  NODE_TYPE.TRACK,
  NODE_TYPE.ARTIST,
  NODE_TYPE.ALBUM,
  NODE_TYPE.PLAYLIST,
]);

type Props = {
  node: GraphNode | null;
  graph: MusicGraph;
  expanded: Set<string>;
  expandingUri: string | null;
  focused: boolean;
  onExpand: (node: GraphNode) => void;
  onFocus: (node: GraphNode) => void;
  onSelect: (node: GraphNode) => void;
  onClearFocus: () => void;
};

const Inspector = ({
  node,
  graph,
  expanded,
  expandingUri,
  focused,
  onExpand,
  onFocus,
  onSelect,
  onClearFocus,
}: Props) => {
  const neighbors = useMemo(() => (node ? graph.neighbors(node.uri) : []), [graph, node]);

  return (
    <aside className="flex h-full w-72 flex-col gap-3 overflow-y-auto border-s border-spice-button/30 bg-spice-card/60 p-4 backdrop-blur">
      {focused && (
        <ButtonSecondary buttonSize="sm" className="self-start" onClick={onClearFocus}>
          {t('inspector.clearFocus')}
        </ButtonSecondary>
      )}
      {!node ? (
        <TextComponent variant="mesto" semanticColor="textSubdued">
          {t('inspector.empty', { count: graph.size })}
        </TextComponent>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <NodeTypeDot type={node.type} />
            <TextComponent variant="mesto" semanticColor="textSubdued">
              {t(`type.${node.type}`)}
            </TextComponent>
          </div>
          <TextComponent variant="alto">{node.label}</TextComponent>

          <div className="flex flex-wrap gap-2">
            {PLAYABLE.has(node.type) && (
              <ButtonSecondary buttonSize="sm" onClick={() => Spicetify.Player.playUri(node.uri)}>
                {t('inspector.play')}
              </ButtonSecondary>
            )}
            {canExpand(node.type) && !expanded.has(node.uri) && (
              <ButtonSecondary
                buttonSize="sm"
                disabled={expandingUri === node.uri}
                onClick={() => onExpand(node)}
              >
                {expandingUri === node.uri ? t('inspector.expanding') : t('inspector.expand')}
              </ButtonSecondary>
            )}
            {neighbors.length > 0 && (
              <ButtonSecondary buttonSize="sm" onClick={() => onFocus(node)}>
                {t('inspector.focus')}
              </ButtonSecondary>
            )}
          </div>

          <TextComponent variant="mesto" semanticColor="textSubdued" className="mt-1">
            {t('inspector.connections', { count: neighbors.length })}
          </TextComponent>
          <ul className="flex flex-col gap-0.5">
            {neighbors.map((n) => (
              <li key={n.uri}>
                <button
                  type="button"
                  onClick={() => onSelect(n)}
                  className="flex w-full items-center gap-2 truncate rounded px-1 py-0.5 text-start hover:bg-spice-highlight/20"
                >
                  <NodeTypeDot type={n.type} />
                  <span className="truncate text-sm text-spice-text">{n.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  );
};

export default Inspector;
